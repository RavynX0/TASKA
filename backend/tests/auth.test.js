const request = require("supertest");
const app = require("../src/app");
const db = require("../src/config/db");
const { _getLastVerificationCode } = require("../src/utils/mailer");
const { registerAndVerify } = require("./helpers");

const credentials = {
  name: "Alice",
  email: "alice@example.com",
  password: "password123",
};

describe("Registration + email verification", () => {
  test("registration creates an unverified account and issues no token", async () => {
    const res = await request(app).post("/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("verification_required");
    expect(res.body.email).toBe("alice@example.com");
    expect(res.body.token).toBeUndefined();

    const { rows } = await db.query("SELECT email_verified FROM users WHERE email = $1", [
      credentials.email,
    ]);
    expect(rows[0].email_verified).toBe(false);
  });

  test("stores only a hashed code, never the raw one", async () => {
    await request(app).post("/auth/register").send(credentials);
    const code = _getLastVerificationCode(credentials.email);

    const { rows } = await db.query("SELECT code_hash FROM email_verifications");
    expect(rows).toHaveLength(1);
    expect(rows[0].code_hash).not.toBe(code);
    expect(rows[0].code_hash.startsWith("$2")).toBe(true);
  });

  test("rejects registration with missing fields", async () => {
    const res = await request(app).post("/auth/register").send({ email: "bad" });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(expect.any(Array));
  });

  test("rejects duplicate email registration", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app).post("/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  test("verifies with the correct code and returns a token", async () => {
    await request(app).post("/auth/register").send(credentials);
    const code = _getLastVerificationCode(credentials.email);

    const res = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email_verified).toBe(true);
    expect(res.body.user.password_hash).toBeUndefined();

    const { rows } = await db.query("SELECT * FROM email_verifications");
    expect(rows).toHaveLength(0);
  });

  test("rejects an incorrect code", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code: "000000" });
    expect(res.status).toBe(400);
  });

  test("a code cannot be reused after successful verification", async () => {
    await request(app).post("/auth/register").send(credentials);
    const code = _getLastVerificationCode(credentials.email);

    await request(app).post("/auth/verify-email").send({ email: credentials.email, code });
    const replay = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code });

    expect(replay.status).toBe(409); // already verified
  });

  test("rejects an expired code", async () => {
    await request(app).post("/auth/register").send(credentials);
    const code = _getLastVerificationCode(credentials.email);
    await db.query("UPDATE email_verifications SET expires_at = now() - interval '1 minute'");

    const res = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/expired/i);
    const { rows } = await db.query("SELECT * FROM email_verifications");
    expect(rows).toHaveLength(0);
  });

  test("locks the code after too many incorrect attempts", async () => {
    await request(app).post("/auth/register").send(credentials);

    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/auth/verify-email")
        .send({ email: credentials.email, code: "000000" });
    }
    const res = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code: "000000" });

    expect(res.status).toBe(429);
    const { rows } = await db.query("SELECT * FROM email_verifications");
    expect(rows).toHaveLength(0);
  });
});

describe("Resend verification", () => {
  test("issues a new code and invalidates the previous one", async () => {
    await request(app).post("/auth/register").send(credentials);
    const firstCode = _getLastVerificationCode(credentials.email);

    await db.query("UPDATE email_verifications SET last_sent_at = now() - interval '5 minutes'");
    const res = await request(app)
      .post("/auth/resend-verification")
      .send({ email: credentials.email });
    expect(res.status).toBe(200);

    const secondCode = _getLastVerificationCode(credentials.email);
    expect(secondCode).not.toBe(firstCode);

    const stale = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code: firstCode });
    expect(stale.status).toBe(400);

    const fresh = await request(app)
      .post("/auth/verify-email")
      .send({ email: credentials.email, code: secondCode });
    expect(fresh.status).toBe(200);
  });

  test("enforces a cooldown between resends", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app)
      .post("/auth/resend-verification")
      .send({ email: credentials.email });
    expect(res.status).toBe(429);
  });

  test("does not reveal whether an unknown email has an account", async () => {
    const res = await request(app)
      .post("/auth/resend-verification")
      .send({ email: "nobody@example.com" });
    expect(res.status).toBe(200);
  });
});

describe("Login", () => {
  test("logs in with email + password only, once verified", async () => {
    await registerAndVerify(credentials);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test("blocks login for an unverified account with a clear message", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/verify your email/i);
  });

  test("rejects login with wrong password", async () => {
    await registerAndVerify(credentials);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  test("rejects login for unknown email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });
    expect(res.status).toBe(401);
  });
});

describe("Protected routes", () => {
  test("GET /auth/me requires authentication", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /auth/me returns the authenticated user", async () => {
    const { token } = await registerAndVerify(credentials);
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  test("rejects requests with an invalid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
