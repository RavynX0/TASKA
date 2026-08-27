const userModel = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await userModel.findByEmail(email.toLowerCase());
  if (existing) {
    throw new AppError(409, "An account with that email already exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.createUser({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = signToken({ id: user.id, email: user.email });
  res.status(201).json({ user, token });
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

  const token = signToken({ id: user.id, email: user.email });
  const { password_hash, ...publicUser } = user;
  res.status(200).json({ user: publicUser, token });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = { register, login, me };
