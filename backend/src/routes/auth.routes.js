const express = require("express");
const authController = require("../controllers/auth.controller");
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
} = require("../validators/auth.validators");
const { requireAuth } = require("../middleware/auth.middleware");
const { createRateLimiter } = require("../utils/rateLimit");

const router = express.Router();

// Unauthenticated verification endpoints - keep scripted abuse in check.
const verifyLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 12,
  message: "Too many verification attempts. Please wait a minute and try again.",
});
const resendLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 6,
  message: "Too many code requests. Please wait a few minutes and try again.",
});

router.post("/register", validateRegister, authController.register);
router.post("/verify-email", verifyLimiter, validateVerifyEmail, authController.verifyEmail);
router.post(
  "/resend-verification",
  resendLimiter,
  validateResendVerification,
  authController.resendVerification
);
router.post("/login", validateLogin, authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/preferences", requireAuth, authController.updatePreferences);

module.exports = router;
