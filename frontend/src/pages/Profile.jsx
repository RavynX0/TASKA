import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import Button from "../components/ui/Button";
import NotificationSettings from "../notifications/NotificationSettings";
import { UserIcon, LogOutIcon, CheckIcon, ClockIcon } from "../components/icons";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { tasks } = useTasks();

  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status !== "completed").length;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h1 className="text-[26px] font-bold leading-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">Your account details.</p>
      </div>

      <div className="rounded-card bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">
            {initials(user?.name) || <UserIcon size={24} />}
          </div>
          <div>
            <p className="text-lg font-bold text-ink">{user?.name}</p>
            <p className="text-sm text-ink-muted">{user?.email}</p>
          </div>
        </div>

        {memberSince && (
          <p className="mt-5 text-sm text-ink-muted">Member since {memberSince}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-soft pt-6">
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckIcon size={17} />
            </span>
            <div>
              <p className="text-lg font-bold text-ink">{completed}</p>
              <p className="text-xs text-ink-muted">Completed tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <ClockIcon size={17} />
            </span>
            <div>
              <p className="text-lg font-bold text-ink">{pending}</p>
              <p className="text-xs text-ink-muted">Open tasks</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border-soft pt-6">
          <NotificationSettings />
        </div>

        <div className="mt-6 border-t border-border-soft pt-6">
          <Button variant="outline" className="text-red-500 hover:bg-red-50" onClick={logout}>
            <LogOutIcon size={17} /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
