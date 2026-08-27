const request = require("supertest");
const app = require("../src/app");

describe("Auth", () => {
  const credentials = {
    name: "Alice",
    email: "alice@example.com",
    password: "password123",
  };

  test("registers a new user and returns a token", async () => {
    const res = await request(app).post("/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: "Alice", email: "alice@example.com" });
    expect(res.body.user.password_hash).toBeUndefined();
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

  test("logs in with correct credentials", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test("rejects login with wrong password", async () => {
    await request(app).post("/auth/register").send(credentials);
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

  test("GET /auth/me requires authentication", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /auth/me returns the authenticated user", async () => {
    const registerRes = await request(app).post("/auth/register").send(credentials);
    const token = registerRes.body.token;

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  test("rejects requests with an invalid token", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
