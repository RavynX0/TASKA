import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { PageLoader } from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import Button from "../components/ui/Button";
import { GripIcon, ArrowRightIcon } from "../components/icons";
import { PriorityBadge } from "../components/ui/Badge";
import { isToday } from "../utils/date";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 7pm

function hourLabel(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

export default function PlanMyDay() {
  const { tasks, isLoading, error, editTask, changeStatus, openEditModal } = useTasks();
  const navigate = useNavigate();
  const [dragTaskId, setDragTaskId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const incomplete = tasks.filter((t) => t.status !== "completed");
  // Inbox = anything not yet given a planned time. Having a due date does NOT
  // pull a task out of the inbox - the user still decides when to work on it.
  const inbox = incomplete.filter((t) => !t.planned_start);
  const scheduledToday = incomplete.filter(
    (t) => t.planned_start && isToday(new Date(t.planned_start))
  );

  const byHour = useMemo(() => {
    const map = {};
    for (const hour of HOURS) map[hour] = [];
    for (const task of scheduledToday) {
      const hour = new Date(task.planned_start).getHours();
      if (map[hour]) map[hour].push(task);
      else if (hour < HOURS[0]) map[HOURS[0]].push(task);
      else map[HOURS[HOURS.length - 1]].push(task);
    }
    return map;
  }, [scheduledToday]);

  if (isLoading) return <PageLoader />;

  // Dragging only ever sets planned_start (today at the chosen hour). It never
  // touches due_date, reminders, or any other task property.
  async function scheduleAt(taskId, hour) {
    setSavingId(taskId);
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    try {
      await editTask(taskId, { plannedStart: date.toISOString() });
    } catch {
      // surfaced via context error state
    } finally {
      setSavingId(null);
      setDragTaskId(null);
    }
  }

  async function unschedule(taskId) {
    setSavingId(taskId);
    try {
      await editTask(taskId, { plannedStart: null });
    } finally {
      setSavingId(null);
      setDragTaskId(null);
    }
  }

  async function handleReadyToStart() {
    const first = [...scheduledToday].sort(
      (a, b) => new Date(a.planned_start) - new Date(b.planned_start)
    )[0];
    if (!first) return;
    await changeStatus(first.id, "in_progress");
    navigate("/dashboard");
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink">Plan your day</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Drag tasks to a time slot to choose when you want to work on them today.
          </p>
        </div>
      </div>

      <ErrorBanner message={error} className="mb-5" />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dragTaskId && unschedule(dragTaskId)}
          className="rounded-card bg-white p-4 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
            Inbox
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-ink-muted">
              {inbox.length}
            </span>
          </h2>
          <p className="mb-3 mt-0.5 text-xs text-ink-muted">Tasks waiting to be scheduled.</p>
          {inbox.length === 0 ? (
            <p className="text-sm text-ink-muted">Everything is scheduled. Nice.</p>
          ) : (
            <div className="space-y-2.5">
              {inbox.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragTaskId(task.id)}
                  onClick={() => openEditModal(task)}
                  className={`flex cursor-grab items-start gap-2 rounded-xl border border-border-soft bg-white p-3 active:cursor-grabbing ${
                    savingId === task.id ? "opacity-50" : ""
                  }`}
                >
                  <GripIcon size={15} className="mt-0.5 shrink-0 text-ink-faint" />
                  <div className="min-w-0 flex-1">
                    <p className="[overflow-wrap:anywhere] text-sm font-semibold text-ink">{task.title}</p>
                    <PriorityBadge priority={task.priority} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-card bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">
              Today ·{" "}
              {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              {scheduledToday.length} scheduled
            </span>
          </div>
          <p className="mb-3 text-xs text-ink-muted">
            Your tasks, organized by when you plan to work on them.
          </p>

          <div className="divide-y divide-border-soft">
            {HOURS.map((hour) => (
              <div
                key={hour}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragTaskId && scheduleAt(dragTaskId, hour)}
                className="flex min-h-[56px] items-center gap-4 py-2"
              >
                <span className="w-14 shrink-0 text-xs font-medium text-ink-faint">
                  {hourLabel(hour)}
                </span>
                <div className="flex-1">
                  {byHour[hour].length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border-soft px-3 py-2.5 text-xs text-ink-faint">
                      Drop task here
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {byHour[hour].map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDragTaskId(task.id)}
                          onClick={() => openEditModal(task)}
                          className={`flex min-w-0 cursor-grab items-center justify-between gap-2 rounded-lg px-3 py-2.5 active:cursor-grabbing ${
                            task.priority === "high" ? "bg-primary-soft" : "bg-canvas"
                          }`}
                        >
                          <span className="min-w-0 flex-1 [overflow-wrap:anywhere] text-sm font-semibold text-ink">{task.title}</span>
                          <PriorityBadge priority={task.priority} className="shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {scheduledToday.length === 0 && (
            <p className="mt-4 rounded-control bg-canvas px-3.5 py-3 text-sm text-ink-muted">
              <span className="font-semibold text-ink">Your day isn't planned yet.</span>{" "}
              Schedule a task to a time slot to get started.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <Button onClick={handleReadyToStart} disabled={scheduledToday.length === 0}>
              Ready to Start <ArrowRightIcon size={17} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
