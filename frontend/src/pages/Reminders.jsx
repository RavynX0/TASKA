import { useTasks } from "../context/TasksContext";
import { PageLoader } from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { AllClearEmpty, CalendarEmpty } from "../components/ui/EmptyIllustrations";
import { PlusIcon, SunIcon, MoonIcon, CalendarIcon } from "../components/icons";
import { formatTime, groupTasksByDate } from "../utils/date";

export default function Reminders() {
  const { tasks, isLoading, error, changeStatus, openEditModal, openCreateModal } = useTasks();

  if (isLoading) return <PageLoader />;

  const incomplete = tasks.filter((t) => t.status !== "completed");
  const groups = groupTasksByDate(incomplete);
  const today = groups.today.sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  const tomorrow = groups.tomorrow.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const upcoming = groups.upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink">Reminders</h1>
          <p className="mt-1 text-sm text-ink-muted">Don't forget these important tasks.</p>
        </div>
      </div>

      <ErrorBanner message={error} className="mb-5" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <SunIcon size={16} />
            <h2 className="text-sm font-bold uppercase tracking-wide">Today</h2>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
              {today.length} left
            </span>
          </div>

          {today.length === 0 ? (
            <EmptyState
              illustration={<AllClearEmpty />}
              title="No reminders for today"
              description="You're all clear. Give a task a due date and it'll show up here."
              action={
                <Button onClick={openCreateModal}>
                  <PlusIcon size={17} /> New reminder
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {today.map((task) => (
                <button
                  key={task.id}
                  onClick={() => openEditModal(task)}
                  className="flex w-full min-w-0 flex-col items-start gap-2 rounded-card bg-white p-5 text-left shadow-sm"
                >
                  <div className="flex w-full min-w-0 items-start gap-3">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        changeStatus(task.id, "completed");
                      }}
                      role="checkbox"
                      aria-checked="false"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="[overflow-wrap:anywhere] text-[15px] font-semibold text-ink">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 [overflow-wrap:anywhere] text-sm text-ink-muted">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 pl-8">
                    {formatTime(task.due_date) && (
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                        {formatTime(task.due_date)}
                      </span>
                    )}
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-ink-muted capitalize">
                      {task.priority}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-ink-muted">
              <MoonIcon size={15} />
              <h2 className="text-xs font-bold uppercase tracking-wide">Tomorrow</h2>
            </div>
            {tomorrow.length === 0 ? (
              <div className="flex flex-col items-center py-3 text-center">
                <CalendarEmpty />
                <p className="mt-1 text-sm text-ink-muted">Nothing scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tomorrow.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => openEditModal(task)}
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-canvas"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                    <span className="w-16 shrink-0 text-xs text-ink-muted">
                      {formatTime(task.due_date)}
                    </span>
                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere] text-sm font-medium text-ink">{task.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-card bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-ink-muted">
              <CalendarIcon size={15} />
              <h2 className="text-xs font-bold uppercase tracking-wide">Upcoming</h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing further ahead yet.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((task) => {
                  const date = new Date(task.due_date);
                  return (
                    <button
                      key={task.id}
                      onClick={() => openEditModal(task)}
                      className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-canvas"
                    >
                      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-canvas text-center leading-none">
                        <span className="text-[9px] font-semibold uppercase text-primary">
                          {date.toLocaleDateString(undefined, { month: "short" })}
                        </span>
                        <span className="text-sm font-bold text-ink">{date.getDate()}</span>
                      </span>
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere] text-sm font-medium text-ink">{task.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={openCreateModal}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Add reminder"
      >
        <PlusIcon size={22} />
      </button>
    </div>
  );
}
