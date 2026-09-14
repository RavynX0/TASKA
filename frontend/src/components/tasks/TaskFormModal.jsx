import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Select from "../ui/Select";
import ErrorBanner from "../ui/ErrorBanner";
import ConfirmDialog from "../ui/ConfirmDialog";
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

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;

// Surface the backend's per-field validation reasons instead of a bare
// "Validation failed".
function errorText(err) {
  if (err?.details?.length) return `${err.message}: ${err.details.join(", ")}`;
  return err?.message || "Something went wrong. Please try again.";
}

// Per-field checks, evaluated on every keystroke so errors can surface inline
// as the user moves through the form (not just on submit).
function validateForm(form) {
  const e = {};
  const title = form.title.trim();
  if (!title) e.title = "Title is required";
  else if (title.length > TITLE_MAX) e.title = `Task title must be ${TITLE_MAX} characters or less.`;

  if (form.description.trim().length > DESCRIPTION_MAX) {
    e.description = `Description must be ${DESCRIPTION_MAX} characters or less.`;
  }

  if (!form.priority) e.priority = "Choose a priority";
  if (!form.status) e.status = "Choose a status";

  if (
    form.plannedStart &&
    form.dueDate &&
    new Date(form.dueDate) < new Date(form.plannedStart)
  ) {
    e.dueDate = "The due date can't be before the planned time";
  }
  return e;
}

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

// Taska calculates the notification time from planned start + reminder offset -
// the user should never have to do that math. `now` is passed in so the preview
// ticks while the modal is open, the way an alarm app counts down.
function buildSchedulePreview(plannedStartLocal, reminderMinutesStr, now) {
  if (!plannedStartLocal) return { kind: "empty" };
  const start = new Date(plannedStartLocal).getTime();
  if (Number.isNaN(start)) return { kind: "empty" };

  const msToStart = start - now;
  if (msToStart <= 0) return { kind: "past" };

  const startLine = `You plan to start this in ${formatCountdown(msToStart)}`;
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
    reminderLine = `Reminder in ${formatCountdown(notifyAt - now)}, around ${clock}`;
  }
  return { kind: "ok", startLine, reminderLine };
}

function makeEmptyForm(defaultReminderMinutes) {
  return {
    title: "",
    description: "",
    // Priority and status are required choices - no pre-selected default.
    status: "",
    priority: "",
    dueDate: "",
    plannedStart: "",
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
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fieldErrors = useMemo(() => validateForm(form), [form]);
  // Show a field's error once the user has left it, or after a submit attempt.
  const errFor = (field) =>
    (touched[field] || submitAttempted) && fieldErrors[field] ? fieldErrors[field] : undefined;
  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

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
      setDeleting(false);
      setTouched({});
      setSubmitAttempted(false);
      setConfirmDelete(false);
      setForm(
        modal.task
          ? {
              title: modal.task.title,
              description: modal.task.description || "",
              status: modal.task.status,
              priority: modal.task.priority,
              dueDate: toDateTimeLocal(modal.task.due_date),
              plannedStart: toDateTimeLocal(modal.task.planned_start),
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

  const schedulePreview = buildSchedulePreview(form.plannedStart, form.reminderMinutes, now);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(fieldErrors).length > 0) {
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      plannedStart: form.plannedStart ? new Date(form.plannedStart).toISOString() : null,
      reminderMinutes:
        form.plannedStart && form.reminderMinutes !== "" ? Number(form.reminderMinutes) : null,
    };
    try {
      if (isEdit) {
        await editTask(modal.task.id, payload);
      } else {
        await addTask(payload);
        // First scheduled task = the right moment to (softly) ask about
        // notifications. armPrimer only unlocks the in-app primer card; it
        // never triggers the browser prompt on its own.
        if (payload.plannedStart) armPrimer();
      }
      closeModal();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return; // guard against a double confirm
    setDeleting(true);
    setError(null);
    try {
      await removeTask(modal.task.id);
      closeModal();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <Modal open={modal.open} onClose={closeModal} title={isEdit ? "Edit Task" : "New Task"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Input
          label={
            <>
              Title <span className="text-red-500">*</span>
            </>
          }
          labelAction={
            <span
              className={`text-xs ${
                form.title.length >= TITLE_MAX ? "text-red-500" : "text-ink-faint"
              }`}
            >
              {form.title.length}/{TITLE_MAX}
            </span>
          }
          name="title"
          placeholder="e.g. Finalize project presentation"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          onBlur={() => markTouched("title")}
          maxLength={TITLE_MAX}
          error={errFor("title")}
          autoFocus
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-ink">Description</label>
            <span
              className={`text-xs ${
                form.description.length >= DESCRIPTION_MAX ? "text-red-500" : "text-ink-faint"
              }`}
            >
              {form.description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
          <textarea
            className={`min-h-[80px] w-full rounded-control border bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-primary ${
              errFor("description") ? "border-red-400" : "border-border-soft"
            }`}
            placeholder="Add more detail (optional)"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            onBlur={() => markTouched("description")}
            maxLength={DESCRIPTION_MAX}
          />
          {errFor("description") && (
            <p className="mt-1 text-xs text-red-500">{errFor("description")}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Priority <span className="text-red-500">*</span>
            </label>
            <Select
              variant="field"
              aria-label="Priority"
              placeholder="Choose priority"
              value={form.priority}
              onChange={(v) => {
                set("priority", v);
                markTouched("priority");
              }}
              options={PRIORITY_OPTIONS}
            />
            {errFor("priority") && (
              <p className="mt-1 text-xs text-red-500">{errFor("priority")}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Status <span className="text-red-500">*</span>
            </label>
            <Select
              variant="field"
              aria-label="Status"
              placeholder="Choose status"
              value={form.status}
              onChange={(v) => {
                set("status", v);
                markTouched("status");
              }}
              options={STATUS_OPTIONS}
            />
            {errFor("status") && (
              <p className="mt-1 text-xs text-red-500">{errFor("status")}</p>
            )}
          </div>
        </div>
        <div className="space-y-4 rounded-control border border-border-soft bg-canvas/60 p-4">
          <p className="text-sm font-semibold text-ink">Timing</p>
          <div>
            <label className="block text-sm font-medium text-ink">Planned time</label>
            <p className="mb-1.5 text-xs text-ink-faint">When you want to work on it.</p>
            <Input
              type="datetime-local"
              value={form.plannedStart}
              onChange={(e) => set("plannedStart", e.target.value)}
              onBlur={() => markTouched("dueDate")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Due date</label>
            <p className="mb-1.5 text-xs text-ink-faint">When it needs to be finished.</p>
            <Input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              onBlur={() => markTouched("dueDate")}
              error={errFor("dueDate")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Reminder</label>
            <p className="mb-1.5 text-xs text-ink-faint">
              When you want Taska to remind you (before the planned time).
            </p>
            <Select
              variant="field"
              aria-label="Reminder"
              value={form.reminderMinutes}
              onChange={(v) => set("reminderMinutes", v)}
              options={REMINDER_OPTIONS}
              disabled={!form.plannedStart}
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
              That planned time has already passed, pick a time in the future to get a reminder.
            </p>
          )}
          {schedulePreview.kind === "empty" && (
            <p className="mt-3 text-xs text-ink-muted">
              Add a planned time to get a reminder and a nudge when it's time to start.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-500 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
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

    <ConfirmDialog
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      onConfirm={handleDelete}
      title="Delete this task?"
      message="Are you sure you want to delete this task? This action cannot be undone."
      confirmLabel="Delete Task"
      destructive
    />
    </>
  );
}
