import { useMemo, useState } from "react";
import { useTasks } from "../context/TasksContext";
import { PageLoader } from "../components/ui/Spinner";
import ErrorBanner from "../components/ui/ErrorBanner";
import EmptyState from "../components/ui/EmptyState";
import TaskCard from "../components/tasks/TaskCard";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { TasksEmpty, SearchEmpty } from "../components/ui/EmptyIllustrations";
import { SearchIcon, PlusIcon } from "../components/icons";
import { groupTasksByDate } from "../utils/date";

const STATUS_FILTERS = [
  { value: "all", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "Doing" },
  { value: "completed", label: "Done" },
];
const PRIORITY_FILTERS = [
  { value: "all", label: "All priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
const SORT_OPTIONS = [
  { value: "soonest", label: "Due date: soonest" },
  { value: "latest", label: "Due date: latest" },
];

export default function Tasks() {
  const { tasks, isLoading, error, openCreateModal } = useTasks();
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("soonest");
  const [search, setSearch] = useState("");

  const clearFilters = () => {
    setStatus("all");
    setPriority("all");
    setSort("soonest");
    setSearch("");
  };

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
        <Select aria-label="Filter by status" value={status} onChange={setStatus} options={STATUS_FILTERS} />
        <Select aria-label="Filter by priority" value={priority} onChange={setPriority} options={PRIORITY_FILTERS} />
        <Select aria-label="Sort tasks" value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      <ErrorBanner message={error} className="mb-5" />

      {filtered.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState
            illustration={<TasksEmpty />}
            title="No tasks yet"
            description="Create your first task and it'll show up here, grouped by when it's due."
            action={
              <Button onClick={openCreateModal}>
                <PlusIcon size={17} /> Create a task
              </Button>
            }
          />
        ) : (
          <EmptyState
            illustration={<SearchEmpty />}
            title="No tasks match these filters"
            description="Try a different status or priority, or clear your search."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )
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
