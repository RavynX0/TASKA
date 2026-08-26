const AppError = require("../utils/AppError");

function validateSubscribe(req, res, next) {
  const { endpoint, keys } = req.body || {};
  const errors = [];

  if (!endpoint || typeof endpoint !== "string") {
    errors.push("endpoint is required");
  }
  if (!keys || typeof keys !== "object") {
    errors.push("keys is required");
  } else {
    if (!keys.p256dh || typeof keys.p256dh !== "string") errors.push("keys.p256dh is required");
    if (!keys.auth || typeof keys.auth !== "string") errors.push("keys.auth is required");
  }

  if (errors.length > 0) {
    return next(new AppError(400, "Validation failed", errors));
  }
  next();
}

function validateUnsubscribe(req, res, next) {
  const { endpoint } = req.body || {};
  if (!endpoint || typeof endpoint !== "string") {
    return next(new AppError(400, "Validation failed", ["endpoint is required"]));
  }
  next();
}

module.exports = { validateSubscribe, validateUnsubscribe };
