import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { PageLoader } from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import Button from "../components/ui/Button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  SettingsIcon,
  ClockIcon,
} from "../components/icons";
import { formatTime, isSameDay } from "../utils/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    days.push(date);
  }
  return days;
}

export default function CalendarPage() {
  const { tasks, isLoading, error, openEditModal } = useTasks();
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const days = useMemo(() => buildGrid(monthCursor), [monthCursor]);
  const dated = tasks.filter((t) => t.due_date);

  function tasksOn(date) {
    return dated.filter((t) => isSameDay(new Date(t.due_date), date));
  }

  const selectedTasks = tasksOn(selectedDate).sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink">Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage your time and tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/reminders"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-muted shadow-sm hover:text-primary"
            title="Reminders"
          >
            <BellIcon size={18} />
          </Link>
          <Link
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-muted shadow-sm hover:text-primary"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </Link>
        </div>
      </div>

      <ErrorBanner message={error} className="mb-5" />

      <div className="grid gap-6 rounded-card bg-white p-5 shadow-sm lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">
              {monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-canvas"
              >
                <ChevronLeftIcon size={16} />
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(now);
                }}
              >
                Today
              </Button>
              <button
                onClick={() =>
                  setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-canvas"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-xs font-semibold text-ink-faint">
                {d}
              </div>
            ))}
            {days.map((date) => {
              const inMonth = date.getMonth() === monthCursor.getMonth();
              const dayTasks = tasksOn(date);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`flex min-h-[76px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary-soft/40"
                      : "border-transparent hover:bg-canvas"
                  } ${!inMonth ? "opacity-35" : ""}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? "bg-primary text-white" : "text-ink"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="flex w-full flex-col gap-0.5">
                    {dayTasks.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="truncate rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-600"
                      >
                        {t.title}
                      </span>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[10px] font-medium text-ink-faint">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border-soft pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
          </p>
          <h3 className="text-lg font-bold text-ink">
            {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </h3>

          {selectedTasks.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No tasks scheduled for this day.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {selectedTasks.map((task) => (
                <li key={task.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      task.priority === "high" ? "bg-primary" : "bg-gray-300"
                    }`}
                  />
                  <button onClick={() => openEditModal(task)} className="flex-1 text-left">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                      <ClockIcon size={12} />
                      {formatTime(task.due_date)}
                    </p>
                    <p className="text-sm font-semibold text-ink">{task.title}</p>
                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-ink-muted">
                      {task.status.replace("_", " ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
