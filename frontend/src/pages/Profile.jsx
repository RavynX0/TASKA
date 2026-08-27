import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { useNotifications } from "../context/NotificationsContext";
import Button from "../components/ui/Button";
import ErrorBanner from "../components/ui/ErrorBanner";
import { UserIcon, LogOutIcon, CheckIcon, ClockIcon, BellIcon } from "../components/icons";

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
  const { isSupported, permission, subscribed, loading, error, enable, disable } =
    useNotifications();

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
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-muted">
              <BellIcon size={17} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Task reminders</p>
              {!isSupported && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  Your browser doesn't support push notifications.
                </p>
              )}
              {isSupported && permission === "denied" && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  Blocked. Enable notifications for this site in your browser settings to get
                  reminders.
                </p>
              )}
              {isSupported && permission !== "denied" && subscribed && (
                <>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Enabled on this device — you'll get a notification before a task's start
                    time, even if Taska isn't open.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={disable} loading={loading}>
                    Disable notifications
                  </Button>
                </>
              )}
              {isSupported && permission !== "denied" && !subscribed && (
                <>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Get a notification before a task's start time — delivered to this device even
                    when Taska is closed.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={enable} loading={loading}>
                    Enable notifications
                  </Button>
                </>
              )}
              <ErrorBanner message={error} className="mt-3" />
            </div>
          </div>
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
