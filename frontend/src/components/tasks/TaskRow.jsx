import { CheckIcon, TasksIcon } from "../icons";
import { formatTime } from "../../utils/date";
import { useTasks } from "../../context/TasksContext";

const AVATAR_STYLES = [
  "bg-blue-50 text-blue-500",
  "bg-green-50 text-green-600",
  "bg-purple-50 text-purple-500",
  "bg-primary-soft text-primary",
];

export default function TaskRow({ task }) {
  const { changeStatus, openEditModal } = useTasks();
  const isDone = task.status === "completed";
  const style = AVATAR_STYLES[task.id % AVATAR_STYLES.length];
  const time = formatTime(task.due_date);

  function toggleComplete(e) {
    e.stopPropagation();
    changeStatus(task.id, isDone ? "pending" : "completed");
  }

  return (
    <button
      onClick={() => openEditModal(task)}
      className="flex w-full items-center gap-3.5 rounded-xl border border-transparent bg-white px-4 py-3.5 text-left transition-colors hover:border-border-soft"
    >
      <span
        onClick={toggleComplete}
        role="checkbox"
        aria-checked={isDone}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isDone ? "bg-primary-soft text-primary" : style
        }`}
      >
        {isDone ? <CheckIcon size={16} /> : <TasksIcon size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-semibold ${isDone ? "text-ink-faint line-through" : "text-ink"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="truncate text-sm text-ink-muted">{task.description}</p>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {time && <span className="text-sm font-medium text-ink-muted">{time}</span>}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isDone ? "bg-gray-100 text-ink-faint" : "bg-primary-soft text-primary"
          }`}
        >
          {isDone ? "Done" : task.status === "in_progress" ? "In progress" : "Pending"}
        </span>
      </span>
    </button>
  );
}
