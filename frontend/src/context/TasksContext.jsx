import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as tasksApi from "../api/tasks";
import { useAuth } from "./AuthContext";

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, task: null });

  // `silent` re-fetches without flipping the page into its loading state -
  // used for background syncs (e.g. after a notification action changes a task
  // in another tab or while the app was closed).
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await tasksApi.listTasks();
      setTasks(data);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  async function addTask(payload) {
    const task = await tasksApi.createTask(payload);
    setTasks((prev) => [task, ...prev]);
    return task;
  }

  async function editTask(id, payload) {
    const task = await tasksApi.updateTask(id, payload);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    return task;
  }

  async function changeStatus(id, status) {
    const task = await tasksApi.updateTaskStatus(id, status);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    return task;
  }

  async function removeTask(id) {
    await tasksApi.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const openCreateModal = () => setModal({ open: true, task: null });
  const openEditModal = (task) => setModal({ open: true, task });
  const closeModal = () => setModal({ open: false, task: null });

  return (
    <TasksContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        refresh,
        addTask,
        editTask,
        changeStatus,
        removeTask,
        modal,
        openCreateModal,
        openEditModal,
        closeModal,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
