const AppError = require("../utils/AppError");

const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

function notFound(req, res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err.code === PG_UNIQUE_VIOLATION) {
    statusCode = 409;
    message = "A record with that value already exists";
    details = undefined;
  } else if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    statusCode = 409;
    message = "Related resource does not exist";
    details = undefined;
  } else if (!err.isOperational && statusCode === 500) {
    console.error(err);
    message = "Internal server error";
    details = undefined;
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
