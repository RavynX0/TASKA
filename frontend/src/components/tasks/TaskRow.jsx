import { CheckIcon, TasksIcon } from "../icons";
import { formatDay, formatPlanned } from "../../utils/date";
import { useTasks } from "../../context/TasksContext";
import StatusMenu from "./StatusMenu";

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
  const hasTiming = task.planned_start || task.due_date;

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
      className="flex w-full min-w-0 cursor-pointer items-center gap-3.5 rounded-xl border border-transparent bg-white px-4 py-3.5 text-left transition-colors hover:border-border-soft"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isDone ? "bg-primary-soft text-primary" : style
        }`}
      >
        {isDone ? <CheckIcon size={16} /> : <TasksIcon size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <p className={`[overflow-wrap:anywhere] text-[15px] font-semibold ${isDone ? "text-ink-faint line-through" : "text-ink"}`}>
          {task.title}
        </p>
        {hasTiming ? (
          <p className="[overflow-wrap:anywhere] text-sm text-ink-muted">
            {task.planned_start && `Planned ${formatPlanned(task.planned_start)}`}
            {task.planned_start && task.due_date && " · "}
            {task.due_date && `Due ${formatDay(task.due_date)}`}
          </p>
        ) : (
          task.description && <p className="[overflow-wrap:anywhere] text-sm text-ink-muted">{task.description}</p>
        )}
      </span>
      <span onClick={(e) => e.stopPropagation()} className="shrink-0">
        <StatusMenu status={task.status} onChange={(status) => changeStatus(task.id, status)} />
      </span>
    </div>
  );
}
