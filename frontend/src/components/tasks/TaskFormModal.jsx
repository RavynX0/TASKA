import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import ErrorBanner from "../ui/ErrorBanner";
import { useTasks } from "../../context/TasksContext";
import { useNotifications } from "../../context/NotificationsContext";
import { REMINDER_OPTIONS } from "../../utils/reminders";
import { STATUS_OPTIONS } from "../../utils/status";
import { BellIcon, ClockIcon } from "../icons";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// "3 hr 20 min", "45 min", "2 days 4 hr" - an alarm-style countdown so the user
// can see how far off a start time / reminder is without doing the math.
function formatCountdown(ms) {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "less than a minute";
  const days = Math.floor(totalMin / 1440);
  const hrs = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hrs) parts.push(`${hrs} hr`);
  if (mins && !days) parts.push(`${mins} min`); // once we're into days, minutes are noise
  return parts.join(" ");
}

// Taska calculates the notification time from start + reminder offset - the user
// should never have to do that math. `now` is passed in so the preview ticks
// while the modal is open, the way an alarm app counts down.
function buildSchedulePreview(startTimeLocal, reminderMinutesStr, now) {
  if (!startTimeLocal) return { kind: "empty" };
  const start = new Date(startTimeLocal).getTime();
  if (Number.isNaN(start)) return { kind: "empty" };

  const msToStart = start - now;
  if (msToStart <= 0) return { kind: "past" };

  const startLine = `Starts in ${formatCountdown(msToStart)}`;
  if (reminderMinutesStr === "") return { kind: "ok", startLine, reminderLine: null };

  const lead = Number(reminderMinutesStr);
  const notifyAt = start - lead * 60000;
  const clock = new Date(notifyAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  let reminderLine;
  if (lead === 0) {
    reminderLine = "Taska will notify you right at the start time";
  } else if (notifyAt <= now) {
    reminderLine = "Taska will notify you as soon as you save";
  } else {
    reminderLine = `Reminder in ${formatCountdown(notifyAt - now)} — around ${clock}`;
  }
  return { kind: "ok", startLine, reminderLine };
}

function makeEmptyForm(defaultReminderMinutes) {
  return {
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    startTime: "",
    reminderMinutes: String(defaultReminderMinutes),
  };
}

export default function TaskFormModal() {
  const { modal, closeModal, addTask, editTask, removeTask } = useTasks();
  const { defaultReminderMinutes, armPrimer } = useNotifications();
  const isEdit = Boolean(modal.task);
  const [form, setForm] = useState(() => makeEmptyForm(defaultReminderMinutes));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tick the countdown once a minute while the modal is open.
  useEffect(() => {
    if (!modal.open) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [modal.open]);

  useEffect(() => {
    if (modal.open) {
      setError(null);
      setForm(
        modal.task
          ? {
              title: modal.task.title,
              description: modal.task.description || "",
              status: modal.task.status,
              priority: modal.task.priority,
              dueDate: toDateTimeLocal(modal.task.due_date),
              startTime: toDateTimeLocal(modal.task.start_time),
              reminderMinutes:
                modal.task.reminder_minutes === null || modal.task.reminder_minutes === undefined
                  ? ""
                  : String(modal.task.reminder_minutes),
            }
          : makeEmptyForm(defaultReminderMinutes)
      );
    }
  }, [modal.open, modal.task, defaultReminderMinutes]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const schedulePreview = buildSchedulePreview(form.startTime, form.reminderMinutes, now);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (form.startTime && form.dueDate && new Date(form.dueDate) < new Date(form.startTime)) {
      setError("Due time can't be before the start time");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      reminderMinutes:
        form.startTime && form.reminderMinutes !== "" ? Number(form.reminderMinutes) : null,
    };
    try {
      if (isEdit) {
        await editTask(modal.task.id, payload);
      } else {
        await addTask(payload);
        // First scheduled task = the right moment to (softly) ask about
        // notifications. armPrimer only unlocks the in-app primer card; it
        // never triggers the browser prompt on its own.
        if (payload.startTime) armPrimer();
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await removeTask(modal.task.id);
      closeModal();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Modal open={modal.open} onClose={closeModal} title={isEdit ? "Edit Task" : "New Task"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Input
          label="Title"
          name="title"
          placeholder="e.g. Finalize project presentation"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          autoFocus
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
          <textarea
            className="min-h-[80px] w-full rounded-control border border-border-soft bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-primary"
            placeholder="Add more detail (optional)"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Priority</label>
            <Select
              variant="field"
              aria-label="Priority"
              value={form.priority}
              onChange={(v) => set("priority", v)}
              options={PRIORITY_OPTIONS}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
            <Select
              variant="field"
              aria-label="Status"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
        <div className="rounded-control border border-border-soft bg-canvas/60 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Schedule</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
            <Input
              label="Due"
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-ink">Reminder</label>
            <Select
              variant="field"
              aria-label="Reminder"
              value={form.reminderMinutes}
              onChange={(v) => set("reminderMinutes", v)}
              options={REMINDER_OPTIONS}
              disabled={!form.startTime}
            />
          </div>
          {schedulePreview.kind === "ok" && (
            <div className="mt-3 space-y-1.5 rounded-control bg-primary-soft/60 px-3.5 py-3">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-primary">
                <ClockIcon size={14} className="shrink-0" />
                {schedulePreview.startLine}
              </p>
              {schedulePreview.reminderLine && (
                <p className="flex items-center gap-2 text-xs text-primary/80">
                  <BellIcon size={13} className="shrink-0" />
                  {schedulePreview.reminderLine}
                </p>
              )}
            </div>
          )}
          {schedulePreview.kind === "past" && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-600">
              <ClockIcon size={14} className="mt-0.5 shrink-0" />
              That start time has already passed — pick a time in the future to get a reminder.
            </p>
          )}
          {schedulePreview.kind === "empty" && (
            <p className="mt-3 text-xs text-ink-muted">
              Add a start time to get a reminder and a start-time nudge for this task.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-500 hover:bg-red-50"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
