const request = require("supertest");
const app = require("../src/app");

async function registerAndLogin(email) {
  const res = await request(app)
    .post("/auth/register")
    .send({ name: "User", email, password: "password123" });
  return res.body.token;
}

describe("Tasks", () => {
  let tokenA;
  let tokenB;

  beforeEach(async () => {
    tokenA = await registerAndLogin("alice@example.com");
    tokenB = await registerAndLogin("bob@example.com");
  });

  test("requires authentication to list tasks", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(401);
  });

  test("creates a task for the authenticated user", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Write report", priority: "high" });

    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({
      title: "Write report",
      priority: "high",
      status: "pending",
    });
  });

  test("rejects task creation without a title", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ description: "no title" });
    expect(res.status).toBe(400);
  });

  test("rejects an invalid status value on create", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Bad status", status: "not-a-status" });
    expect(res.status).toBe(400);
  });

  test("lists only the authenticated user's tasks", async () => {
    await request(app).post("/tasks").set("Authorization", `Bearer ${tokenA}`).send({ title: "Alice task" });
    await request(app).post("/tasks").set("Authorization", `Bearer ${tokenB}`).send({ title: "Bob task" });

    const res = await request(app).get("/tasks").set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe("Alice task");
  });

  test("gets a single task by id", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Task one" });
    const taskId = createRes.body.task.id;

    const res = await request(app).get(`/tasks/${taskId}`).set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.task.id).toBe(taskId);
  });

  test("returns 404 for a non-existent task id", async () => {
    const res = await request(app).get("/tasks/999999").set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });

  test("returns 400 for an invalid task id format", async () => {
    const res = await request(app).get("/tasks/abc").set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
  });

  test("prevents a user from reading another user's task", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Alice private task" });
    const taskId = createRes.body.task.id;

    const res = await request(app).get(`/tasks/${taskId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test("prevents a user from updating another user's task", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Alice task" });
    const taskId = createRes.body.task.id;

    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Hijacked" });
    expect(res.status).toBe(404);
  });

  test("prevents a user from deleting another user's task", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Alice task" });
    const taskId = createRes.body.task.id;

    const res = await request(app).delete(`/tasks/${taskId}`).set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  test("updates a task's own fields", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Original" });
    const taskId = createRes.body.task.id;

    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Updated", priority: "low" });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ title: "Updated", priority: "low" });
  });

  test("rejects an update with an empty body", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Original" });
    const taskId = createRes.body.task.id;

    const res = await request(app).patch(`/tasks/${taskId}`).set("Authorization", `Bearer ${tokenA}`).send({});
    expect(res.status).toBe(400);
  });

  test("marks a task as completed via the status endpoint", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Finish me" });
    const taskId = createRes.body.task.id;

    const res = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe("completed");
  });

  test("rejects an invalid status on the status endpoint", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Finish me" });
    const taskId = createRes.body.task.id;

    const res = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "done" });

    expect(res.status).toBe(400);
  });

  test("filters tasks by status", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "To complete" });
    const taskId = createRes.body.task.id;
    await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "completed" });
    await request(app).post("/tasks").set("Authorization", `Bearer ${tokenA}`).send({ title: "Still pending" });

    const res = await request(app).get("/tasks?status=completed").set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe("To complete");
  });

  test("deletes a task", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Delete me" });
    const taskId = createRes.body.task.id;

    const deleteRes = await request(app).delete(`/tasks/${taskId}`).set("Authorization", `Bearer ${tokenA}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/tasks/${taskId}`).set("Authorization", `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);
  });
});
