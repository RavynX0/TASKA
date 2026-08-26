const taskModel = require("../models/task.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, startTime, reminderMinutes } = req.body;

  const task = await taskModel.createTask({
    userId: req.user.id,
    title: title.trim(),
    description,
    status,
    priority,
    dueDate,
    startTime,
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
  const { title, description, status, priority, dueDate, startTime, reminderMinutes } = req.body;

  const existing = await taskModel.findByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    throw new AppError(404, "Task not found");
  }

  // Setting a start time with no explicit reminder gets the default lead time.
  const resolvedReminder =
    startTime !== undefined && startTime !== null && reminderMinutes === undefined
      ? 10
      : reminderMinutes;

  // Rescheduling clears any already-sent flag so the reminder can fire again for the new time.
  const reschedule = startTime !== undefined || reminderMinutes !== undefined;

  const task = await taskModel.updateForUser(req.params.id, req.user.id, {
    title: title !== undefined ? title.trim() : undefined,
    description,
    status,
    priority,
    due_date: dueDate,
    start_time: startTime,
    reminder_minutes: resolvedReminder,
    reminder_sent_at: reschedule ? null : undefined,
  });

  res.status(200).json({ task });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const existing = await taskModel.findByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    throw new AppError(404, "Task not found");
  }

  const task = await taskModel.updateForUser(req.params.id, req.user.id, {
    status: req.body.status,
  });

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
