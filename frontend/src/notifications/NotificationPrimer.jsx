import { useNotifications } from "../context/NotificationsContext";
import Button from "../components/ui/Button";
import { BellIcon, CheckIcon } from "../components/icons";

// Bottom-corner slot for the two transient notification moments:
//   1. the soft "ask before the ask" primer - shown only after the user has
//      created a scheduled task, explaining why Taska wants permission *before*
//      the browser's own prompt fires.
//   2. a brief success confirmation once notifications are on, which clears
//      itself after a few seconds.
// Only the "Enable notifications" button ever triggers the browser prompt.
export default function NotificationPrimer() {
  const { primerVisible, justEnabled, enable, dismissPrimer, loading } = useNotifications();

  if (justEnabled) {
    return (
      <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm">
        <div className="flex items-start gap-3 rounded-card border border-green-100 bg-white p-4 shadow-lg">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckIcon size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Notifications are on</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Taska will remind you about your scheduled tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!primerVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm">
      <div className="rounded-card border border-border-soft bg-white p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <BellIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-ink">Want Taska to remind you?</p>
            <p className="mt-1 text-sm text-ink-muted">
              Get a gentle notification when a scheduled task is about to start — even when Taska
              isn't the tab you're looking at.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={dismissPrimer}>
            Not now
          </Button>
          <Button size="sm" onClick={enable} loading={loading}>
            Enable notifications
          </Button>
        </div>
      </div>
    </div>
  );
}
