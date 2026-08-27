import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ErrorBanner from "../ui/ErrorBanner";
import { useTasks } from "../../context/TasksContext";
import { REMINDER_OPTIONS, DEFAULT_REMINDER_MINUTES } from "../../utils/reminders";
import { STATUS_OPTIONS } from "../../utils/status";
import { BellIcon } from "../icons";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// Taska calculates the notification time from start + reminder offset -
// the user should never have to do that math themselves.
function computeReminderPreview(startTimeLocal, reminderMinutesStr) {
  if (!startTimeLocal || reminderMinutesStr === "") return null;
  const start = new Date(startTimeLocal);
  if (Number.isNaN(start.getTime())) return null;
  const lead = Number(reminderMinutesStr);
  const notifyAt = new Date(start.getTime() - lead * 60000);
  const time = notifyAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return lead === 0
    ? `You'll be reminded right when it's time to start this task.`
    : `You'll be reminded at ${time} to start this task.`;
}

const emptyForm = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  dueDate: "",
  startTime: "",
  reminderMinutes: String(DEFAULT_REMINDER_MINUTES),
};

export default function TaskFormModal() {
  const { modal, closeModal, addTask, editTask, removeTask } = useTasks();
  const isEdit = Boolean(modal.task);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          : emptyForm
      );
    }
  }, [modal.open, modal.task]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const reminderPreview = computeReminderPreview(form.startTime, form.reminderMinutes);

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
            <select
              className="h-11 w-full rounded-control border border-border-soft bg-white px-3.5 text-[15px] text-ink outline-none focus:border-primary"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
            <select
              className="h-11 w-full rounded-control border border-border-soft bg-white px-3.5 text-[15px] text-ink outline-none focus:border-primary"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
            <select
              className="h-11 w-full rounded-control border border-border-soft bg-white px-3.5 text-[15px] text-ink outline-none focus:border-primary disabled:opacity-50"
              value={form.reminderMinutes}
              onChange={(e) => set("reminderMinutes", e.target.value)}
              disabled={!form.startTime}
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reminderPreview && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-primary">
              <BellIcon size={14} className="mt-0.5 shrink-0" />
              {reminderPreview}
            </p>
          )}
          {!form.startTime && (
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
