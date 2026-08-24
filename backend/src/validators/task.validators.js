const AppError = require("../utils/AppError");

const STATUS_VALUES = ["pending", "in_progress", "completed"];
const PRIORITY_VALUES = ["low", "medium", "high"];

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

function validateId(req, res, next) {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return next(new AppError(400, "Invalid task id"));
  }
  next();
}

function validateCreateTask(req, res, next) {
  const { title, description, status, priority, dueDate } = req.body || {};
  const errors = [];

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    errors.push("title is required");
  } else if (title.length > 200) {
    errors.push("title must be 200 characters or fewer");
  }

  if (description !== undefined && typeof description !== "string") {
    errors.push("description must be a string");
  }

  if (status !== undefined && !STATUS_VALUES.includes(status)) {
    errors.push(`status must be one of: ${STATUS_VALUES.join(", ")}`);
  }

  if (priority !== undefined && !PRIORITY_VALUES.includes(priority)) {
    errors.push(`priority must be one of: ${PRIORITY_VALUES.join(", ")}`);
  }

  if (dueDate !== undefined && dueDate !== null && !isValidDate(dueDate)) {
    errors.push("dueDate must be a valid date");
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  next();
}

function validateUpdateTask(req, res, next) {
  const { title, description, status, priority, dueDate } = req.body || {};
  const errors = [];

  if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
    errors.push("title must be a non-empty string");
  }
  if (title !== undefined && title.length > 200) {
    errors.push("title must be 200 characters or fewer");
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    errors.push("description must be a string");
  }
  if (status !== undefined && !STATUS_VALUES.includes(status)) {
    errors.push(`status must be one of: ${STATUS_VALUES.join(", ")}`);
  }
  if (priority !== undefined && !PRIORITY_VALUES.includes(priority)) {
    errors.push(`priority must be one of: ${PRIORITY_VALUES.join(", ")}`);
  }
  if (dueDate !== undefined && dueDate !== null && !isValidDate(dueDate)) {
    errors.push("dueDate must be a valid date");
  }

  if (Object.keys(req.body || {}).length === 0) {
    errors.push("at least one field must be provided");
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  next();
}

function validateStatusUpdate(req, res, next) {
  const { status } = req.body || {};
  if (!status || !STATUS_VALUES.includes(status)) {
    return next(new AppError(400, "Validation failed", [`status must be one of: ${STATUS_VALUES.join(", ")}`]));
  }
  next();
}

function validateListQuery(req, res, next) {
  const { status, priority } = req.query;
  const errors = [];

  if (status !== undefined && !STATUS_VALUES.includes(status)) {
    errors.push(`status must be one of: ${STATUS_VALUES.join(", ")}`);
  }
  if (priority !== undefined && !PRIORITY_VALUES.includes(priority)) {
    errors.push(`priority must be one of: ${PRIORITY_VALUES.join(", ")}`);
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  next();
}

module.exports = {
  validateId,
  validateCreateTask,
  validateUpdateTask,
  validateStatusUpdate,
  validateListQuery,
  STATUS_VALUES,
  PRIORITY_VALUES,
};
