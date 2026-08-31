const request = require("supertest");
const app = require("../src/app");
const { _getLastVerificationCode } = require("../src/utils/mailer");

// Registers a user and immediately clears email verification, returning the
// authenticated session - the common setup for tests that aren't about the
// verification flow itself.
async function registerAndVerify({ name = "User", email, password = "password123" } = {}) {
  await request(app).post("/auth/register").send({ name, email, password });
  const code = _getLastVerificationCode(email);
  const res = await request(app).post("/auth/verify-email").send({ email, code });
  return { token: res.body.token, user: res.body.user, id: res.body.user.id };
}

module.exports = { registerAndVerify };
