const request = require("supertest");
const app = require("../src/app");
const db = require("../src/config/db");
const { processDueReminders } = require("../src/jobs/reminderScheduler");
const { registerAndVerify } = require("./helpers");

async function registerUser(email) {
  const { token, id } = await registerAndVerify({ email });
  return { token, id };
}

// Insert a task straight into the DB with precise timestamps - the API clamps
// start/due times to the future in practice, but the scheduler logic is all
// about "what happens once they're in the past".
async function seedTask(userId, overrides = {}) {
  const cols = {
    user_id: userId,
    title: "Physics",
    status: "pending",
    planned_start: null,
    due_date: null,
    reminder_minutes: null,
    reminder_sent_at: null,
    start_notified_at: null,
    due_notified_at: null,
    snooze_until: null,
    snooze_count: 0,
    ...overrides,
  };
  const keys = Object.keys(cols);
  const result = await db.query(
    `INSERT INTO tasks (${keys.join(", ")})
     VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")})
     RETURNING *`,
    keys.map((k) => cols[k])
  );
  return result.rows[0];
}

const reload = async (id) => (await db.query("SELECT * FROM tasks WHERE id = $1", [id])).rows[0];

describe("Notification preferences endpoint", () => {
  let token;
  beforeEach(async () => {
    ({ token } = await registerUser("prefs@example.com"));
  });

  test("new users start with all server toggles on", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    // stored blob is empty; the app layer resolves defaults
    expect(res.body.user.notification_preferences).toEqual({});
  });

  test("patches only known boolean keys and merges", async () => {
    const res = await request(app)
      .patch("/auth/preferences")
      .set("Authorization", `Bearer ${token}`)
      .send({ startTimeNotifications: false, bogusKey: true, followUpNotifications: "nope" });

    expect(res.status).toBe(200);
    expect(res.body.user.notification_preferences).toEqual({ startTimeNotifications: false });

    const second = await request(app)
      .patch("/auth/preferences")
      .set("Authorization", `Bearer ${token}`)
      .send({ followUpNotifications: false });
    expect(second.body.user.notification_preferences).toEqual({
      startTimeNotifications: false,
      followUpNotifications: false,
    });
  });

  test("requires authentication", async () => {
    const res = await request(app).patch("/auth/preferences").send({ startTimeNotifications: false });
    expect(res.status).toBe(401);
  });
});

describe("Notification lifecycle (scheduler)", () => {
  let user;
  beforeEach(async () => {
    user = await registerUser("life@example.com");
  });

  test("start-time nudge fires once and does not repeat", async () => {
    const t = await seedTask(user.id);
    await db.query("UPDATE tasks SET planned_start = now() - interval '2 minutes' WHERE id = $1", [t.id]);

    await processDueReminders();
    const afterFirst = await reload(t.id);
    expect(afterFirst.start_notified_at).not.toBeNull();

    await processDueReminders();
    const afterSecond = await reload(t.id);
    expect(afterSecond.start_notified_at).toEqual(afterFirst.start_notified_at);
    expect(afterSecond.snooze_count).toBe(0);
  });

  test("an ignored start nudge produces exactly one follow-up", async () => {
    const t = await seedTask(user.id);
    await db.query(
      "UPDATE tasks SET planned_start = now() - interval '1 hour', start_notified_at = now() - interval '31 minutes' WHERE id = $1",
      [t.id]
    );

    await processDueReminders();
    expect((await reload(t.id)).snooze_count).toBe(1);

    // second pass: no further follow-ups
    await processDueReminders();
    expect((await reload(t.id)).snooze_count).toBe(1);
  });

  test("Skip (muteCheckins) stops the start cycle", async () => {
    const t = await seedTask(user.id, { snooze_count: -1 });
    await db.query("UPDATE tasks SET planned_start = now() - interval '5 minutes' WHERE id = $1", [t.id]);

    await processDueReminders();
    expect((await reload(t.id)).start_notified_at).toBeNull();
  });

  test("in_progress tasks get no start nudge", async () => {
    const t = await seedTask(user.id, { status: "in_progress" });
    await db.query("UPDATE tasks SET planned_start = now() - interval '5 minutes' WHERE id = $1", [t.id]);

    await processDueReminders();
    expect((await reload(t.id)).start_notified_at).toBeNull();
  });

  test("due check-in fires once", async () => {
    const t = await seedTask(user.id);
    await db.query("UPDATE tasks SET due_date = now() - interval '1 minute' WHERE id = $1", [t.id]);

    await processDueReminders();
    const first = await reload(t.id);
    expect(first.due_notified_at).not.toBeNull();

    await processDueReminders();
    expect((await reload(t.id)).due_notified_at).toEqual(first.due_notified_at);
  });

  test("completed tasks get no due check-in", async () => {
    const t = await seedTask(user.id, { status: "completed" });
    await db.query("UPDATE tasks SET due_date = now() - interval '1 minute' WHERE id = $1", [t.id]);

    await processDueReminders();
    expect((await reload(t.id)).due_notified_at).toBeNull();
  });

  test("startTimeNotifications=false still advances state (no re-queue loop)", async () => {
    await request(app)
      .patch("/auth/preferences")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ startTimeNotifications: false });

    const t = await seedTask(user.id);
    await db.query("UPDATE tasks SET planned_start = now() - interval '5 minutes' WHERE id = $1", [t.id]);

    await processDueReminders();
    expect((await reload(t.id)).start_notified_at).not.toBeNull();
  });

  test("startTimeNotifications=false also mutes the before-start reminder (still advances)", async () => {
    await request(app)
      .patch("/auth/preferences")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ startTimeNotifications: false });

    const t = await seedTask(user.id, { reminder_minutes: 10 });
    await db.query("UPDATE tasks SET planned_start = now() + interval '5 minutes' WHERE id = $1", [t.id]);

    await processDueReminders();
    const after = await reload(t.id);
    expect(after.reminder_sent_at).not.toBeNull(); // advanced, so it won't re-queue
  });

  test("missedTaskNotifications=false mutes the due check-in but still advances", async () => {
    await request(app)
      .patch("/auth/preferences")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ missedTaskNotifications: false });

    const t = await seedTask(user.id);
    await db.query("UPDATE tasks SET due_date = now() - interval '1 minute' WHERE id = $1", [t.id]);

    await processDueReminders();
    const after = await reload(t.id);
    expect(after.due_notified_at).not.toBeNull();

    await processDueReminders();
    expect((await reload(t.id)).due_notified_at).toEqual(after.due_notified_at);
  });

  test("reschedule via API clears the notification flags", async () => {
    const t = await seedTask(user.id, { snooze_count: 2 });
    await db.query(
      "UPDATE tasks SET planned_start = now() - interval '1 hour', start_notified_at = now(), due_notified_at = now() WHERE id = $1",
      [t.id]
    );

    const res = await request(app)
      .patch(`/tasks/${t.id}`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ plannedStart: new Date(Date.now() + 3600_000).toISOString() });

    expect(res.status).toBe(200);
    const after = await reload(t.id);
    expect(after.start_notified_at).toBeNull();
    expect(after.snooze_count).toBe(0);
  });
});
