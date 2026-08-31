import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { PageLoader } from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { TasksEmpty, AllClearEmpty, CalendarEmpty } from "../components/ui/EmptyIllustrations";
import TaskRow from "../components/tasks/TaskRow";
import { ClockIcon, CalendarIcon, PlusIcon, CheckIcon, MoreHorizontalIcon } from "../components/icons";
import { formatTime, formatDay, formatPlanned, greetingForNow, groupTasksByDate } from "../utils/date";

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, isLoading, error, changeStatus, openCreateModal, openEditModal } = useTasks();

  if (isLoading) return <PageLoader />;

  const incomplete = tasks.filter((t) => t.status !== "completed");
  const groups = groupTasksByDate(tasks);
  const todayTasks = [...groups.today, ...groups.noDate].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    return new Date(a.due_date || 0) - new Date(b.due_date || 0);
  });

  const nextUp = incomplete
    .filter((t) => t.priority === "high")
    .concat(incomplete)
    .sort((a, b) => new Date(a.due_date || 8640000000000000) - new Date(b.due_date || 8640000000000000))[0];

  const remainingToday = todayTasks.filter((t) => t.status !== "completed").length;
  const restOfToday = todayTasks.filter((t) => t.id !== nextUp?.id);

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink">
            {greetingForNow()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {remainingToday > 0
              ? `You have ${remainingToday} task${remainingToday === 1 ? "" : "s"} remaining today.`
              : "You're all caught up for today."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/plan-my-day">
            <Button variant="outline">Plan My Day</Button>
          </Link>
          <Button onClick={openCreateModal}>
            <PlusIcon size={17} /> Add Task
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} className="mb-5" />

      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <h2 className="text-[15px] font-bold text-ink">Next Up</h2>
          </div>

          {nextUp ? (
            <div className="relative overflow-hidden rounded-card bg-surface-dark p-6 text-white">
              <ClockIcon size={110} className="absolute -right-4 -top-4 text-white/5" />
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                  {nextUp.status === "in_progress" ? "Doing" : "Task"}
                </span>
                {nextUp.priority === "high" && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold">
                    High Priority
                  </span>
                )}
              </div>
              <h3 className="max-w-md text-xl font-bold">{nextUp.title}</h3>
              {nextUp.description && (
                <p className="mt-1 max-w-md text-sm text-white/60">{nextUp.description}</p>
              )}
              {(nextUp.planned_start || nextUp.due_date) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                  {nextUp.planned_start && (
                    <span className="flex items-center gap-1.5">
                      <ClockIcon size={15} /> Planned: {formatPlanned(nextUp.planned_start)}
                    </span>
                  )}
                  {nextUp.due_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon size={15} /> Due: {formatDay(nextUp.due_date)}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => changeStatus(nextUp.id, "in_progress")}
                  disabled={nextUp.status === "in_progress"}
                >
                  {nextUp.status === "in_progress" ? "Doing" : "Start Task"}
                </Button>
                <button
                  onClick={() => changeStatus(nextUp.id, "completed")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  title="Mark complete"
                >
                  <CheckIcon size={18} />
                </button>
                <button
                  onClick={() => openEditModal(nextUp)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  title="Edit task"
                >
                  <MoreHorizontalIcon size={18} />
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              illustration={<TasksEmpty />}
              title="Nothing urgent right now"
              description="Add your first task and Taska will keep it front and centre."
              action={
                <Button onClick={openCreateModal}>
                  <PlusIcon size={17} /> Add Task
                </Button>
              }
            />
          )}

          <div className="mb-3 mt-8 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">Today's Tasks</h2>
            <Link to="/tasks" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          {restOfToday.length === 0 ? (
            <EmptyState
              illustration={<AllClearEmpty />}
              title="No more tasks for today"
              description="Enjoy the calm, or line up what's next."
              action={
                <Link to="/plan-my-day">
                  <Button variant="outline">Plan my day</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {restOfToday.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="rounded-card bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[15px] font-bold text-ink">Tomorrow</h2>
            {groups.tomorrow.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CalendarEmpty />
                <p className="mt-2 text-sm text-ink-muted">Nothing scheduled for tomorrow yet.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {groups.tomorrow
                  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                  .map((task, i) => (
                    <li key={task.id} className="flex gap-3">
                      <span className="mt-1.5 flex flex-col items-center">
                        <span
                          className={`h-2 w-2 rounded-full ${i === 0 ? "bg-primary" : "bg-gray-300"}`}
                        />
                        {i < groups.tomorrow.length - 1 && (
                          <span className="mt-1 h-full w-px flex-1 bg-border-soft" />
                        )}
                      </span>
                      <button
                        onClick={() => openEditModal(task)}
                        className="flex-1 text-left"
                      >
                        <p className="text-xs font-medium text-ink-muted">{formatTime(task.due_date)}</p>
                        <p className="text-sm font-semibold text-ink">{task.title}</p>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
