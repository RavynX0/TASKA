const taskModel = require("../models/task.model");
const pushSubscriptionModel = require("../models/pushSubscription.model");
const userModel = require("../models/user.model");
const { webpush, isConfigured } = require("../config/webpush");

const CHECK_INTERVAL_MS = 30000;
const MAX_SNOOZES = 3;

// One prefs lookup per user per scheduler tick, not per task.
function makePrefsLoader() {
  const cache = new Map();
  return async (userId) => {
    if (!cache.has(userId)) {
      const user = await userModel.findById(userId);
      cache.set(userId, userModel.resolvePreferences(user && user.notification_preferences));
    }
    return cache.get(userId);
  };
}

async function sendToSubscription(subscription, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload
    );
    console.log(`[push] delivered to subscription ${subscription.id} (user ${subscription.user_id})`);
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription is gone (browser data cleared, uninstalled, etc.) - stop targeting it.
      await pushSubscriptionModel.deleteByEndpointOnly(subscription.endpoint);
      console.warn(`[push] subscription ${subscription.id} expired (${err.statusCode}) - removed`);
    } else {
      console.error(
        `[push] send failed for subscription ${subscription.id}: ${err.statusCode || ""} ${err.message}`,
        err.body || ""
      );
    }
  }
}

async function sendToUser(userId, notification) {
  const subscriptions = await pushSubscriptionModel.findAllForUser(userId);
  if (subscriptions.length === 0) {
    console.warn(`[push] user ${userId} has a due notification but no push subscription`);
    return;
  }
  const payload = JSON.stringify(notification);
  await Promise.all(subscriptions.map((sub) => sendToSubscription(sub, payload)));
}

// "Before start" reminder ("Physics starts in 10 minutes"). Same "task
// reminders" category as the start-time nudge, so it shares the
// startTimeNotifications toggle. State is still advanced when muted.
async function processBeforeStartReminders(getPrefs) {
  const dueTasks = await taskModel.findDueReminders();

  for (const task of dueTasks) {
    const prefs = await getPrefs(task.user_id);
    if (!prefs.startTimeNotifications) {
      await taskModel.markReminderSent(task.id);
      continue;
    }

    const lead = task.reminder_minutes;
    await sendToUser(task.user_id, {
      title:
        lead > 0
          ? `${task.title} starts in ${lead} minute${lead === 1 ? "" : "s"}`
          : `Time for ${task.title}`,
      body: task.description || undefined,
      tag: `task-${task.id}-before`,
      data: { type: "before_start", taskId: task.id, taskTitle: task.title },
      actions: [
        { action: "start", title: "Start now" },
        { action: "snooze", title: "Remind me later" },
      ],
    });
    await taskModel.markReminderSent(task.id);
  }
}

// Start-time nudge, then at most one automatic follow-up, then any snoozes the
// user explicitly asked for (bounded by MAX_SNOOZES), then silence.
async function processStartCheckins(getPrefs) {
  const dueTasks = await taskModel.findDueStartCheckins();

  for (const task of dueTasks) {
    const count = task.snooze_count ?? 0;
    const firstNudge = !task.start_notified_at;
    const prefs = await getPrefs(task.user_id);

    const advance = () =>
      firstNudge ? taskModel.markStartNotified(task.id) : taskModel.markFollowUpSent(task.id);

    // Respect the user's toggles, but still advance state so a muted stage
    // never re-queues on the next tick.
    const muted = firstNudge
      ? !prefs.startTimeNotifications
      : !prefs.followUpNotifications;
    if (muted) {
      await advance();
      continue;
    }

    // Snooze ceiling: stop quietly, no final nagging notification.
    if (!firstNudge && count >= MAX_SNOOZES) {
      await advance();
      continue;
    }

    const notification = firstNudge
      ? {
          title: `Time for ${task.title}`,
          body: task.description || undefined,
          tag: `task-${task.id}-start`,
          data: { type: "start_due", taskId: task.id, taskTitle: task.title },
          actions: [
            { action: "start", title: "Start task" },
            { action: "snooze", title: "Remind me later" },
          ],
        }
      : {
          // Spec's "Did you get started on X?" - one automatic follow-up.
          title: `Did you get started on ${task.title}?`,
          tag: `task-${task.id}-start`,
          data: { type: "start_due", taskId: task.id, taskTitle: task.title },
          actions: [
            { action: "start", title: "Start task" },
            { action: "snooze", title: "Remind me later" },
            { action: "skip", title: "Skip" },
          ],
        };

    await sendToUser(task.user_id, notification);
    await advance();
  }
}

// End-of-task check-in - fires once, never says "overdue" or "late". Copy is
// kept timezone-agnostic (no absolute clock time) because the backend doesn't
// know the user's local zone. Gated by the user's "missed-task" toggle; when
// it's off we still stamp due_notified_at so the task doesn't re-queue.
async function processDueCheckins(getPrefs) {
  const dueTasks = await taskModel.findDueDueNotifications();

  for (const task of dueTasks) {
    const prefs = await getPrefs(task.user_id);
    if (!prefs.missedTaskNotifications) {
      await taskModel.markDueNotified(task.id);
      continue;
    }

    const inProgress = task.status === "in_progress";
    await sendToUser(task.user_id, {
      title: inProgress
        ? `Still working on ${task.title}?`
        : `${task.title} was scheduled to wrap up`,
      tag: `task-${task.id}-due`,
      data: { type: "due", taskId: task.id, taskTitle: task.title },
      actions: [
        { action: "done", title: "Mark done" },
        { action: "continue", title: inProgress ? "Still working" : "Continue" },
        { action: "reschedule", title: "Reschedule" },
      ],
    });
    await taskModel.markDueNotified(task.id);
  }
}

async function processDueReminders() {
  const getPrefs = makePrefsLoader();
  await processBeforeStartReminders(getPrefs);
  await processStartCheckins(getPrefs);
  await processDueCheckins(getPrefs);
}

function startReminderScheduler() {
  if (!isConfigured) {
    console.warn("Reminder scheduler not started: VAPID keys missing.");
    return null;
  }

  const interval = setInterval(() => {
    processDueReminders().catch((err) => console.error("Reminder scheduler error:", err));
  }, CHECK_INTERVAL_MS);

  console.log(`Reminder scheduler started (checking every ${CHECK_INTERVAL_MS / 1000}s).`);
  return interval;
}

module.exports = { startReminderScheduler, processDueReminders };
