import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTasks } from "../../context/TasksContext";

// Handles two things a "Reschedule" notification action can trigger:
// 1. A fresh window opened at /tasks?reschedule=<id> (self.clients.openWindow)
// 2. A message posted to an already-open tab asking it to navigate there
//    (self.clients focus + postMessage, when the SW found an existing client)
export default function RescheduleDeepLinkHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks, isLoading, openEditModal } = useTasks();

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
      if (event.data?.type === "taska-navigate" && event.data.path) {
        navigate(event.data.path);
      }
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  return null;
}
