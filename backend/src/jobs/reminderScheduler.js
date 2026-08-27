const taskModel = require("../models/task.model");
const pushSubscriptionModel = require("../models/pushSubscription.model");
const { webpush, isConfigured } = require("../config/webpush");

const CHECK_INTERVAL_MS = 30000;

async function sendToSubscription(subscription, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload
    );
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription is gone (browser data cleared, uninstalled, etc.) - stop targeting it.
      await pushSubscriptionModel.deleteByEndpointOnly(subscription.endpoint);
    } else {
      console.error(`Push send failed for subscription ${subscription.id}:`, err.message);
    }
  }
}

async function processDueReminders() {
  const dueTasks = await taskModel.findDueReminders();

  for (const task of dueTasks) {
    const subscriptions = await pushSubscriptionModel.findAllForUser(task.user_id);
    const payload = JSON.stringify({
      title: task.title,
      body: task.description || "Your task is starting soon.",
      tag: `task-${task.id}`,
    });

    await Promise.all(subscriptions.map((sub) => sendToSubscription(sub, payload)));
    await taskModel.markReminderSent(task.id);
  }
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
