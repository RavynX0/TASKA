import { useMemo, useState } from "react";
import { useTasks } from "../context/TasksContext";
import { PageLoader } from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import EmptyState from "../components/ui/EmptyState";
import TaskCard from "../components/tasks/TaskCard";
import { SearchIcon, TasksIcon } from "../components/icons";
import { groupTasksByDate } from "../utils/date";

const SELECT_CLASS =
  "h-10 rounded-full border border-border-soft bg-white px-4 text-sm font-medium text-ink outline-none focus:border-primary";

export default function Tasks() {
  const { tasks, isLoading, error } = useTasks();
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("soonest");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = tasks;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (priority !== "all") list = list.filter((t) => t.priority === priority);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => {
      const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return sort === "soonest" ? aTime - bTime : bTime - aTime;
    });
    return sorted;
  }, [tasks, status, priority, sort, search]);

  if (isLoading) return <PageLoader />;

  const groups = groupTasksByDate(filtered);
  const overdueOrUndated = filtered.filter(
    (t) => !groups.today.includes(t) && !groups.tomorrow.includes(t) && !groups.upcoming.includes(t)
  );

  const sections = [
    { key: "today", label: "Today", items: groups.today },
    { key: "tomorrow", label: "Tomorrow", items: groups.tomorrow },
    { key: "upcoming", label: "Upcoming", items: groups.upcoming },
    { key: "other", label: "No Due Date", items: overdueOrUndated },
  ].filter((s) => s.items.length > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold leading-tight text-ink">My Tasks</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage and organize your upcoming work.</p>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="relative">
          <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-10 w-52 rounded-full border border-border-soft bg-white pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT_CLASS}>
          <option value="soonest">Due Date: Soonest</option>
          <option value="latest">Due Date: Latest</option>
        </select>
      </div>

      <ErrorBanner message={error} className="mb-5" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<TasksIcon size={32} />}
          title="No tasks match these filters"
          description="Try adjusting your filters or create a new task."
        />
      ) : (
        <div className="space-y-8">
          {sections.map(({ key, label, items }) => (
            <div key={key}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-ink">{label}</h2>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                  {items.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
