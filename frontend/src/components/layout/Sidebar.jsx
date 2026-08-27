import { NavLink } from "react-router-dom";
import { HomeIcon, TasksIcon, CalendarIcon, BellIcon, UserIcon, PlusIcon, LogOutIcon, XIcon } from "../icons";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TasksContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: HomeIcon },
  { to: "/tasks", label: "Tasks", icon: TasksIcon },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/reminders", label: "Reminders", icon: BellIcon },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const { openCreateModal } = useTasks();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Fixed (not scroll-flow) on every breakpoint, so it never moves with page scroll. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 -translate-x-full flex-col bg-white px-5 py-6 shadow-sm transition-transform duration-200 lg:inset-y-auto lg:left-4 lg:top-4 lg:bottom-4 lg:h-auto lg:w-60 lg:translate-x-0 lg:rounded-[50px] lg:px-7 lg:py-8 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Logo
            size={36}
            subtitle="Productivity Hub"
            nameClassName="text-[15px] font-bold text-ink"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas lg:hidden"
            aria-label="Close menu"
          >
            <XIcon size={18} />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-ink-muted hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <ItemIcon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            openCreateModal();
            onClose();
          }}
          className="mb-4 flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          <PlusIcon size={17} />
          Add Task
        </button>

        <div className="flex items-center gap-2.5 border-t border-border-soft pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {initials(user?.name) || <UserIcon size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-ink-faint hover:bg-canvas hover:text-ink"
            aria-label="Log out"
            title="Log out"
          >
            <LogOutIcon size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
