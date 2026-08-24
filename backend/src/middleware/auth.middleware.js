const { verifyToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");
const userModel = require("../models/user.model");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(401, "Authentication required");
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw new AppError(401, "Invalid or expired token");
    }

    const user = await userModel.findById(payload.id);
    if (!user) {
      throw new AppError(401, "Invalid or expired token");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
