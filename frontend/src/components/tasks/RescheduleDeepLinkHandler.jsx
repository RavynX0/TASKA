import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTasks } from "../../context/TasksContext";

// Bridges the service worker back to the running app:
// 1. A fresh window opened at /tasks?reschedule=<id> (self.clients.openWindow)
// 2. A "navigate" message posted to an already-open tab (Reschedule action)
// 3. A "tasks changed" message after a notification action (Start / Done /
//    snooze) so the dashboard reflects the new status without a reload.
export default function RescheduleDeepLinkHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks, isLoading, openEditModal, refresh } = useTasks();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("reschedule");
    if (!id || isLoading) return;

    const task = tasks.find((t) => String(t.id) === id);
    if (task) {
      openEditModal(task);
      params.delete("reschedule");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, tasks, isLoading]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMessage(event) {
      const msg = event.data || {};
      if (msg.type === "taska-navigate" && msg.path) {
        navigate(msg.path);
        refresh({ silent: true });
      } else if (msg.type === "taska-tasks-changed") {
        refresh({ silent: true });
      }
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate, refresh]);

  // Backstop: if a notification action fired while this tab was hidden or the
  // message was missed, re-sync when the user comes back to the tab.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") refresh({ silent: true });
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return null;
}
