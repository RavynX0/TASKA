import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as tasksApi from "../api/tasks";
import { useAuth } from "./AuthContext";

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, task: null });
  const tasksRef = useRef(tasks);
  const taskMutationVersion = useRef(0);
  // Track in-flight removals by id. This both de-duplicates accidental repeat
  // requests and gives a failed request the exact task it must restore.
  const pendingDeletes = useRef(new Map());

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // `silent` re-fetches without flipping the page into its loading state -
  // used for background syncs (e.g. after a notification action changes a task
  // in another tab or while the app was closed).
  const refresh = useCallback(async ({ silent = false } = {}) => {
    const refreshVersion = taskMutationVersion.current;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await tasksApi.listTasks();
      // A list response that started before an optimistic delete must not put
      // that task back into the UI after the user has removed it.
      if (refreshVersion === taskMutationVersion.current) {
        tasksRef.current = data;
        setTasks(data);
      }
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
    const existingDelete = pendingDeletes.current.get(id);
    if (existingDelete) return existingDelete.promise;

    // Capture the task from a synchronously maintained snapshot. This means
    // several clicks in quick succession cannot use an out-of-date render.
    const currentTasks = tasksRef.current;
    const deletedIndex = currentTasks.findIndex((task) => task.id === id);
    const deletedTask = currentTasks[deletedIndex];

    // Nothing in the current list corresponds to this request.
    if (!deletedTask) return;

    const remainingTasks = currentTasks.filter((task) => task.id !== id);
    taskMutationVersion.current += 1;
    tasksRef.current = remainingTasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));

    const request = tasksApi.deleteTask(id);
    pendingDeletes.current.set(id, { promise: request, task: deletedTask, index: deletedIndex });

    try {
      await request;
    } catch (err) {
      // Restore only this task, and only if it has not been reintroduced by a
      // refresh or another successful state update while the request was pending.
      const currentTasks = tasksRef.current;
      if (!currentTasks.some((task) => task.id === id)) {
        const index = Math.min(deletedIndex, currentTasks.length);
        tasksRef.current = [
          ...currentTasks.slice(0, index),
          deletedTask,
          ...currentTasks.slice(index),
        ];
        setTasks((prev) => {
          if (prev.some((task) => task.id === id)) return prev;
          const restoreIndex = Math.min(deletedIndex, prev.length);
          return [...prev.slice(0, restoreIndex), deletedTask, ...prev.slice(restoreIndex)];
        });
      }
      throw err;
    } finally {
      pendingDeletes.current.delete(id);
    }
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
