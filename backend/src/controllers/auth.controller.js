const userModel = require("../models/user.model");
const emailVerificationModel = require("../models/emailVerification.model");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateCode, hashCode, compareCode } = require("../utils/verificationCode");
const { sendVerificationEmail } = require("../utils/mailer");
const { signToken } = require("../utils/jwt");
const config = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const TTL_MINUTES = config.emailVerification.codeTtlMinutes;
const MAX_ATTEMPTS = config.emailVerification.maxAttempts;
const RESEND_COOLDOWN_MS = config.emailVerification.resendCooldownSeconds * 1000;

function stripSecret(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Generate a fresh code, hash it, store it (replacing any previous one) and
// email it. Shared by registration and resend.
async function issueVerificationCode(user) {
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
  await emailVerificationModel.replaceForUser(user.id, codeHash, expiresAt);
  await sendVerificationEmail(user.email, code, TTL_MINUTES);
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    throw new AppError(409, "An account with that email already exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  // New accounts start unverified (DB default) and get no session yet.
  await issueVerificationCode(user);

  res.status(201).json({
    status: "verification_required",
    email: user.email,
    expiresInMinutes: TTL_MINUTES,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  // Same message whether the account is missing or the code is simply wrong -
  // don't confirm which addresses have accounts.
  const invalid = new AppError(400, "That code is invalid or has expired. Request a new one.");

  const user = await userModel.findByEmail(email.toLowerCase());
  if (!user) throw invalid;

  if (user.email_verified) {
    throw new AppError(409, "This email is already verified. You can log in.");
  }

  const record = await emailVerificationModel.findActive(user.id);
  if (!record) throw invalid;

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await emailVerificationModel.deleteForUser(user.id);
    throw new AppError(400, "Your verification code has expired. Request a new one.");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await emailVerificationModel.deleteForUser(user.id);
    throw new AppError(
      429,
      "Too many incorrect attempts. That code has been cleared - request a new one."
    );
  }

  const matches = await compareCode(code, record.code_hash);
  if (!matches) {
    const attempts = await emailVerificationModel.incrementAttempts(record.id);
    const left = Math.max(0, MAX_ATTEMPTS - attempts);
    throw new AppError(
      400,
      left > 0
        ? `That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`
        : "That code isn't right. Request a new one."
    );
  }

  const verifiedUser = await userModel.markEmailVerified(user.id);
  // Single-use: destroy the code so it can never be replayed.
  await emailVerificationModel.deleteForUser(user.id);

  const token = signToken({ id: verifiedUser.id, email: verifiedUser.email });
  res.status(200).json({ user: verifiedUser, token });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const generic = {
    status: "ok",
    message: "If that account still needs verification, a new code is on its way.",
    expiresInMinutes: TTL_MINUTES,
  };

  const user = await userModel.findByEmail(email.toLowerCase());
  if (!user || user.email_verified) {
    return res.status(200).json(generic);
  }

  const record = await emailVerificationModel.findActive(user.id);
  if (record) {
    const elapsed = Date.now() - new Date(record.last_sent_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new AppError(
        429,
        `Please wait ${wait} second${wait === 1 ? "" : "s"} before requesting another code.`
      );
    }
  }

  await issueVerificationCode(user);
  res.status(200).json(generic);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findByEmail(email.toLowerCase());
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  if (!user.email_verified) {
    throw new AppError(403, "Please verify your email before logging in.", {
      reason: "email_not_verified",
    });
  }

  const token = signToken({ id: user.id, email: user.email });
  res.status(200).json({ user: stripSecret(user), token });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await userModel.updatePreferences(req.user.id, req.body || {});
  res.status(200).json({ user });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  me,
  updatePreferences,
};
