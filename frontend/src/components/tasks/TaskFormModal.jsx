import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import ErrorBanner from "../ui/ErrorBanner";
import { useTasks } from "../../context/TasksContext";
import { REMINDER_OPTIONS, DEFAULT_REMINDER_MINUTES } from "../../utils/reminders";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
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
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <Input
          label="Due date"
          type="datetime-local"
          value={form.dueDate}
          onChange={(e) => set("dueDate", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start time"
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Remind me</label>
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
        </div>
        {form.startTime && (
          <p className="-mt-2 text-xs text-ink-muted">
            A browser notification fires while Taska is open in this tab.
          </p>
        )}
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
