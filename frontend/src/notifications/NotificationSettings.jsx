import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications, STATUS } from "../context/NotificationsContext";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import ErrorBanner from "../components/ui/ErrorBanner";
import { BellIcon, CheckIcon } from "../components/icons";

const REMINDER_CHOICES = [
  { value: 0, label: "At start time" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
];

// Server-backed notification categories. Each maps to a preference the backend
// scheduler actually reads (user.model PREFERENCE_DEFAULTS) - no dead toggles.
const CATEGORIES = [
  {
    key: "startTimeNotifications",
    label: "Task reminders",
    hint: "A heads-up before a scheduled task, and a nudge when it's time to start.",
  },
  {
    key: "followUpNotifications",
    label: "Follow-up reminders",
    hint: "One gentle check-in later if you didn't act on the start-time nudge.",
  },
  {
    key: "missedTaskNotifications",
    label: "Missed-task alerts",
    hint: "One check-in when a scheduled task reaches its end time unfinished.",
  },
];

function Toggle({ checked, onChange, disabled, label, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </label>
  );
}

export default function NotificationSettings() {
  const { user, updateNotificationPreferences } = useAuth();
  const {
    status,
    loading,
    error,
    justEnabled,
    enable,
    disable,
    recheckPermission,
    defaultReminderMinutes,
    setDefaultReminderMinutes,
    sendTestNotification,
    testResult,
  } = useNotifications();

  const [savingPref, setSavingPref] = useState(null);
  const [prefError, setPrefError] = useState(null);

  const serverPrefs = {
    startTimeNotifications: true,
    followUpNotifications: true,
    missedTaskNotifications: true,
    ...(user?.notification_preferences || {}),
  };

  async function setServerPref(key, value) {
    setSavingPref(key);
    setPrefError(null);
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (err) {
      setPrefError(err?.message || "Couldn't save that setting. Please try again.");
    } finally {
      setSavingPref(null);
    }
  }

  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-muted">
        <BellIcon size={17} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          Stay on top of your scheduled tasks without constantly checking Taska.
        </p>

        {status === STATUS.NOT_SUPPORTED && (
          <p className="mt-3 rounded-control bg-canvas px-3.5 py-2.5 text-sm text-ink-muted">
            This browser doesn't support notifications. Taska works fine without them, your
            dashboard always has the latest.
          </p>
        )}

        {status === STATUS.PERMISSION_DENIED && (
          <div className="mt-3 rounded-control border border-border-soft bg-canvas px-3.5 py-3">
            <p className="text-sm font-medium text-ink">Notifications are blocked</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Your browser is currently blocking Taska notifications. Allow notifications for this
              site in your browser settings, then check again.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={recheckPermission} loading={loading}>
              Check again
            </Button>
          </div>
        )}

        {(status === STATUS.PERMISSION_DEFAULT ||
          status === STATUS.PERMISSION_GRANTED ||
          status === STATUS.SUBSCRIBING) && (
          <>
            <p className="mt-3 text-sm text-ink-muted">
              Browser notifications are currently off. Turn them on to get a reminder when a
              scheduled task is about to start, delivered even when Taska is closed.
            </p>
            <Button size="sm" className="mt-3" onClick={enable} loading={loading}>
              Enable notifications
            </Button>
          </>
        )}

        {status === STATUS.SUBSCRIPTION_FAILED && (
          <>
            <p className="mt-3 text-sm text-ink-muted">
              We couldn't finish setting up notifications on this device.
            </p>
            <Button size="sm" className="mt-3" onClick={enable} loading={loading}>
              Try again
            </Button>
          </>
        )}

        {status === STATUS.SUBSCRIBED && (
          <>
            {justEnabled && (
              <p className="mt-3 flex items-center gap-2 rounded-control border border-green-100 bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700">
                <CheckIcon size={15} /> Notifications are on. Taska will remind you about your
                scheduled tasks.
              </p>
            )}

            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
              <CheckIcon size={15} className="text-green-600" /> Browser notifications enabled on
              this device
            </p>

            <div className="mt-3 divide-y divide-border-soft border-y border-border-soft">
              {CATEGORIES.map((c) => (
                <Toggle
                  key={c.key}
                  label={c.label}
                  hint={c.hint}
                  checked={serverPrefs[c.key]}
                  disabled={savingPref === c.key}
                  onChange={(v) => setServerPref(c.key, v)}
                />
              ))}
            </div>

            <div className="mt-4 max-w-xs">
              <p className="block text-sm font-medium text-ink">Default reminder</p>
              <p className="mb-2 mt-0.5 text-xs text-ink-muted">
                Pre-filled when you add a start time to a task. You can still change it per task.
              </p>
              <Select
                variant="field"
                aria-label="Default reminder"
                value={defaultReminderMinutes}
                onChange={setDefaultReminderMinutes}
                options={REMINDER_CHOICES}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={sendTestNotification}
                loading={testResult?.kind === "sending"}
              >
                Send a test notification
              </Button>
              <Button size="sm" variant="ghost" onClick={disable} loading={loading}>
                Disable notifications
              </Button>
            </div>

            {testResult?.kind === "sent" && (
              <div className="mt-2 space-y-1 text-xs">
                <p className="flex items-center gap-1.5 font-medium text-green-700">
                  <CheckIcon size={13} /> Sent, Taska has {testResult.testCount || 1} test
                  notification{(testResult.testCount || 1) === 1 ? "" : "s"} active on this device.
                </p>
                <p className="text-ink-muted">
                  Don't see it on screen? It's a device setting, not Taska. Open{" "}
                  <span className="font-medium text-ink">Windows Settings → System → Notifications</span>,
                  turn off <span className="font-medium text-ink">Do not disturb / Focus</span>, make
                  sure your browser is switched on there, and check the notification centre (
                  <span className="font-medium text-ink">Win + N</span>).
                </p>
              </div>
            )}
            {(testResult?.kind === "blocked" || testResult?.kind === "error") && (
              <p className="mt-2 text-xs text-red-600">{testResult.message}</p>
            )}
            {!testResult && (
              <p className="mt-2 text-xs text-ink-muted">
                Sends a notification to this device right now, so you can confirm it shows up.
              </p>
            )}
          </>
        )}

        <ErrorBanner message={error || prefError} className="mt-3" />
      </div>
    </div>
  );
}
