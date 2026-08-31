const AppError = require("./AppError");
const config = require("../config/env");

// Small in-memory fixed-window limiter. Enough to blunt scripted abuse of the
// unauthenticated verification endpoints on a single-instance deployment; swap
// for a shared store (Redis) if Taska ever runs multiple API processes.
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    if (config.nodeEnv === "test") return next();

    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);

    if (recent.length > max) {
      return next(
        new AppError(429, message || "Too many requests. Please slow down and try again shortly.")
      );
    }
    next();
  };
}

module.exports = { createRateLimiter };
