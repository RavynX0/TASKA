import { PriorityBadge } from "../ui/Badge";
import { ClockIcon, CalendarIcon, BellIcon } from "../icons";
import { formatDay, formatTime } from "../../utils/date";
import { useTasks } from "../../context/TasksContext";

export default function TaskCard({ task }) {
  const { changeStatus, openEditModal } = useTasks();
  const isDone = task.status === "completed";

  function toggleComplete(e) {
    e.stopPropagation();
    changeStatus(task.id, isDone ? "pending" : "completed");
  }

  return (
    <button
      onClick={() => openEditModal(task)}
      className="flex flex-col items-start rounded-card bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span
          onClick={toggleComplete}
          role="checkbox"
          aria-checked={isDone}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            isDone ? "border-primary bg-primary" : "border-gray-300"
          }`}
        >
          {isDone && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
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
        <p className="mt-2 line-clamp-2 pl-8 text-sm text-ink-muted">{task.description}</p>
      )}
      {task.due_date && (
        <div className="mt-3 flex items-center gap-1.5 pl-8 text-xs text-ink-muted">
          <CalendarIcon size={14} />
          {formatDay(task.due_date)}
          {formatTime(task.due_date) && (
            <>
              <ClockIcon size={14} className="ml-1.5" />
              {formatTime(task.due_date)}
            </>
          )}
        </div>
      )}
      {task.start_time && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-8 text-xs text-primary">
          <BellIcon size={13} />
          Starts {formatTime(task.start_time)}
          {task.reminder_minutes != null &&
            ` · reminds ${task.reminder_minutes === 0 ? "at start" : `${task.reminder_minutes}m before`}`}
        </div>
      )}
    </button>
  );
}
