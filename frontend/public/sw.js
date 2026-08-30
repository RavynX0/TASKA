// Taska service worker (classic, non-module - no bundler runs over this file).
//
// Responsibilities:
//   - receive Web Push messages and show one notification per lifecycle stage
//   - handle clicks and action buttons, acting on the task via the API so the
//     user never has to reopen Taska for the common choices
//   - focus an existing Taska tab (or open one) and route it to the right place
//
// Config that can't be imported is passed on the registration URL's query
// string. The auth token is read from the same IndexedDB store the page mirrors
// it into (src/utils/tokenStore.js) - a service worker can't touch localStorage.

const API_URL = new URL(self.location.href).searchParams.get("apiUrl") || "";

const DB_NAME = "taska-sw-store";
const STORE = "kv";
const ICON = "/icon-192.png"; // full-colour app mark shown in the notification
const BADGE = "/badge-96.png"; // monochrome silhouette for the status bar / small UI

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function getStoredToken() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => {
      try {
        const tx = req.result.transaction(STORE, "readonly");
        const getReq = tx.objectStore(STORE).get("token");
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    req.onerror = () => resolve(null);
  });
}

async function apiPatch(path, body) {
  const token = await getStoredToken();
  if (!token || !API_URL) return false;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Tell every open Taska tab that task data changed, so the dashboard / list
// reflects a notification action without the user reloading.
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const c of clients) c.postMessage(message);
}

// A short, self-dismissing confirmation so the user knows their tap landed -
// even when Taska isn't open. Reuses the task's tag so it replaces the original.
async function confirmToast(taskId, text) {
  await self.registration.showNotification("Taska", {
    body: text,
    tag: `task-${taskId}`,
    icon: ICON,
    badge: BADGE,
    requireInteraction: false,
  });
}

const label = (data) => data.taskTitle || "your task";

async function setStatus(taskId, status, data, confirmText) {
  const ok = await apiPatch(`/tasks/${taskId}/status`, { status });
  if (ok) {
    await notifyClients({ type: "taska-tasks-changed", taskId, status });
    if (confirmText) await confirmToast(taskId, confirmText);
  } else {
    await confirmToast(taskId, "Couldn't reach Taska. Open the app to update this task.");
  }
  return ok;
}

async function snoozeBy(taskId, minutes) {
  const ok = await apiPatch(`/tasks/${taskId}`, {
    snoozeUntil: new Date(Date.now() + minutes * 60000).toISOString(),
  });
  await confirmToast(
    taskId,
    ok
      ? `Okay - Taska will remind you again in ${minutes === 60 ? "1 hour" : minutes + " minutes"}.`
      : "Couldn't set that reminder. Open Taska to try again."
  );
}

async function focusOrOpen(path) {
  const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of allClients) {
    if ("focus" in client) {
      client.postMessage({ type: "taska-navigate", path });
      return client.focus();
    }
  }
  if (self.clients.openWindow) return self.clients.openWindow(path);
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag, // stages share a tag per task, so a new one replaces the old
      data: payload.data,
      actions: payload.actions,
      icon: ICON,
      badge: BADGE,
      lang: "en",
      timestamp: Date.now(),
      renotify: Boolean(payload.tag),
      // Keep it on screen until the user deals with it, rather than
      // auto-dismissing after a few seconds.
      requireInteraction: true,
    })
  );
});

// A single native action button can't open a submenu, so "Remind me later"
// shows a second notification with the actual duration choices.
async function showSnoozeChoices(data) {
  await self.registration.showNotification("Remind me later", {
    body: `When should Taska nudge you about ${label(data)} again?`,
    tag: `task-${data.taskId}-start`,
    icon: ICON,
    badge: BADGE,
    requireInteraction: true,
    data,
    actions: [
      { action: "snooze:10", title: "In 10 min" },
      { action: "snooze:30", title: "In 30 min" },
      { action: "snooze:60", title: "In 1 hour" },
    ],
  });
}

self.addEventListener("notificationclick", (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  const taskId = data.taskId;
  event.notification.close();

  event.waitUntil(
    (async () => {
      if (action.startsWith("snooze:")) {
        await snoozeBy(taskId, Number(action.split(":")[1]));
        return;
      }

      switch (action) {
        // Start-time nudge / follow-up / before-start reminder
        case "start":
          await setStatus(taskId, "in_progress", data, `${label(data)} is now in progress.`);
          return;
        case "snooze": // "Remind me later" -> choose an interval
        case "snooze10": // legacy one-tap action still sitting in a tray
          await showSnoozeChoices(data);
          return;
        case "skip": // stop this task's check-in cycle for good
          await apiPatch(`/tasks/${taskId}`, { muteCheckins: true });
          await confirmToast(taskId, `Got it - no more reminders about ${label(data)}.`);
          return;

        // Due-time check-in
        case "done":
          await setStatus(taskId, "completed", data, `Nice - ${label(data)} is done.`);
          return;
        case "continue":
          // Keep working, no status change. due_notified_at is already set,
          // so Taska won't notify about this task again.
          await confirmToast(taskId, `Okay - keep going on ${label(data)}.`);
          return;

        case "reschedule":
          await focusOrOpen(`/tasks?reschedule=${taskId}`);
          return;

        // Body click (no action button)
        default:
          await focusOrOpen(taskId ? `/tasks?reschedule=${taskId}` : "/dashboard");
      }
    })()
  );
});
