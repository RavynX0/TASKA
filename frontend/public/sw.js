// Classic (non-module) service worker - no bundler runs over this file, so it
// can't `import` the app's ES modules. Config is passed in via the
// registration URL's query string, and the auth token is read from the same
// IndexedDB store the page mirrors it into (see src/utils/tokenStore.js) -
// a service worker has no access to localStorage.
const API_URL = new URL(self.location.href).searchParams.get("apiUrl") || "";

const DB_NAME = "taska-sw-store";
const STORE = "kv";

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
  if (!token || !API_URL) return;
  await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).catch(() => {});
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
  const payload = event.data.json();

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: payload.data,
      actions: payload.actions,
      icon: "/favicon.svg",
      renotify: Boolean(payload.actions?.length),
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  event.notification.close();

  event.waitUntil(
    (async () => {
      switch (action) {
        case "start":
          await apiPatch(`/tasks/${data.taskId}/status`, { status: "in_progress" });
          break;

        case "done":
          await apiPatch(`/tasks/${data.taskId}/status`, { status: "completed" });
          break;

        case "snooze15":
          await apiPatch(`/tasks/${data.taskId}`, {
            snoozeUntil: new Date(Date.now() + 15 * 60000).toISOString(),
          });
          break;

        case "keep":
          await apiPatch(`/tasks/${data.taskId}`, { muteCheckins: true });
          break;

        case "more":
          // Second-level choice: a single notification action can't offer a
          // native submenu, so this swaps in a follow-up notification with
          // the actual time options - a real second step, not a fake one.
          await self.registration.showNotification("How much more time?", {
            tag: `task-${data.taskId}-due`,
            icon: "/favicon.svg",
            data: { type: "due_more_options", taskId: data.taskId, dueDate: data.dueDate },
            actions: [
              { action: "more15", title: "+15 min" },
              { action: "more30", title: "+30 min" },
              { action: "more1h", title: "+1 hour" },
            ],
          });
          break;

        case "more15":
        case "more30":
        case "more1h": {
          const minutes = action === "more15" ? 15 : action === "more30" ? 30 : 60;
          const base = data.dueDate ? new Date(data.dueDate) : new Date();
          await apiPatch(`/tasks/${data.taskId}`, {
            dueDate: new Date(base.getTime() + minutes * 60000).toISOString(),
          });
          break;
        }

        case "reschedule":
          await focusOrOpen(`/tasks?reschedule=${data.taskId}`);
          return;

        default:
          await focusOrOpen("/dashboard");
          return;
      }
    })()
  );
});
