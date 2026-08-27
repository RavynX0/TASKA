import { PriorityBadge } from "../ui/Badge";
import { ClockIcon, BellIcon } from "../icons";
import StatusMenu from "./StatusMenu";
import { formatTime } from "../../utils/date";
import { useTasks } from "../../context/TasksContext";

export default function TaskCard({ task }) {
  const { changeStatus, openEditModal } = useTasks();
  const isDone = task.status === "completed";
  const hasRange = task.start_time || task.due_date;

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEditModal(task);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openEditModal(task)}
      onKeyDown={onKeyDown}
      className="flex cursor-pointer flex-col items-start rounded-card bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <p
          className={`flex-1 text-[15px] font-semibold leading-snug ${
            isDone ? "text-ink-faint line-through" : "text-ink"
          }`}
        >
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{task.description}</p>
      )}

      {hasRange && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <ClockIcon size={14} />
          {task.start_time && formatTime(task.start_time)}
          {task.start_time && task.due_date && " → "}
          {task.due_date && formatTime(task.due_date)}
        </div>
      )}

      {task.start_time && task.reminder_minutes != null && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary">
          <BellIcon size={13} />
          Reminder set
        </div>
      )}

      <div className="mt-3.5 w-full" onClick={(e) => e.stopPropagation()}>
        <StatusMenu status={task.status} onChange={(status) => changeStatus(task.id, status)} />
      </div>
    </div>
  );
}
