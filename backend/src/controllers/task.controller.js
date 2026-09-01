const taskModel = require("../models/task.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, plannedStart, reminderMinutes } = req.body;

  const task = await taskModel.createTask({
    userId: req.user.id,
    title: title.trim(),
    description: typeof description === "string" ? description.trim() || null : description,
    status,
    priority,
    dueDate,
    plannedStart,
    reminderMinutes,
  });

  res.status(201).json({ task });
});

const listTasks = asyncHandler(async (req, res) => {
  const { status, priority, search } = req.query;
  const tasks = await taskModel.findAllForUser(req.user.id, { status, priority, search });
  res.status(200).json({ tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskModel.findByIdForUser(req.params.id, req.user.id);
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  res.status(200).json({ task });
});

const updateTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    status,
    priority,
    dueDate,
    plannedStart,
    reminderMinutes,
    snoozeUntil,
    muteCheckins,
  } = req.body;

  const existing = await taskModel.findByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    throw new AppError(404, "Task not found");
  }

  // Reminders are always explicit - dragging a task onto a time slot sets only
  // planned_start, never a reminder. Clearing the planned time clears any reminder.
  const resolvedReminder = plannedStart === null ? null : reminderMinutes;

  // Re-planning clears every "already notified"/snooze flag so the full
  // planned-start -> reminder -> due cycle can run again for the new time.
  const reschedule = plannedStart !== undefined || reminderMinutes !== undefined;

  let snoozeCount;
  let resolvedSnoozeUntil = snoozeUntil;
  if (muteCheckins === true) {
    snoozeCount = -1;
    resolvedSnoozeUntil = null;
  } else if (snoozeUntil !== undefined) {
    const current = existing.snooze_count ?? 0;
    snoozeCount = current < 0 ? 1 : current + 1;
  }

  const task = await taskModel.updateForUser(req.params.id, req.user.id, {
    title: title !== undefined ? title.trim() : undefined,
    description:
      description === undefined
        ? undefined
        : typeof description === "string"
          ? description.trim() || null
          : description,
    status,
    priority,
    due_date: dueDate,
    planned_start: plannedStart,
    reminder_minutes: resolvedReminder,
    reminder_sent_at: reschedule ? null : undefined,
    start_notified_at: reschedule ? null : undefined,
    due_notified_at: dueDate !== undefined ? null : undefined,
    snooze_until: reschedule ? null : resolvedSnoozeUntil,
    snooze_count: reschedule ? 0 : snoozeCount,
  });

  res.status(200).json({ task });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const existing = await taskModel.findByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    throw new AppError(404, "Task not found");
  }

  const { status } = req.body;
  const fields = { status };

  if (status === "pending") {
    // Re-opening a task resets its whole notification cycle.
    fields.start_notified_at = null;
    fields.due_notified_at = null;
    fields.snooze_until = null;
    fields.snooze_count = 0;
  } else if (status === "in_progress") {
    // Task has started - stop nagging the user to start it.
    fields.snooze_until = null;
    fields.snooze_count = 0;
  }

  const task = await taskModel.updateForUser(req.params.id, req.user.id, fields);

  res.status(200).json({ task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const deleted = await taskModel.deleteForUser(req.params.id, req.user.id);
  if (!deleted) {
    throw new AppError(404, "Task not found");
  }
  res.status(204).send();
});

module.exports = { createTask, listTasks, getTask, updateTask, updateTaskStatus, deleteTask };
