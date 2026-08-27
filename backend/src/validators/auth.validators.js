const AppError = require("../utils/AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("name is required");
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    errors.push("a valid email is required");
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push("password is required and must be at least 8 characters");
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== "string") {
    errors.push("email is required");
  }
  if (!password || typeof password !== "string") {
    errors.push("password is required");
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  next();
}

module.exports = { validateRegister, validateLogin };
