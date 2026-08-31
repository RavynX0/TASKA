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

function validateVerifyEmail(req, res, next) {
  const { email, code } = req.body || {};
  const errors = [];

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    errors.push("a valid email is required");
  }
  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    errors.push("a 6-digit code is required");
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  req.body.code = code.trim();
  next();
}

function validateResendVerification(req, res, next) {
  const { email } = req.body || {};

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return next(new AppError(400, "Validation failed", ["a valid email is required"]));
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
};
