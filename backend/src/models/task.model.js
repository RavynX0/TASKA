const db = require("../config/db");

async function createTask({
  userId,
  title,
  description,
  status,
  priority,
  dueDate,
  startTime,
  reminderMinutes,
}) {
  const resolvedReminder = startTime ? reminderMinutes ?? 10 : null;
  const result = await db.query(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date, start_time, reminder_minutes)
     VALUES ($1, $2, $3, COALESCE($4::task_status, 'pending'), COALESCE($5::task_priority, 'medium'), $6, $7, $8)
     RETURNING *`,
    [
      userId,
      title,
      description ?? null,
      status,
      priority,
      dueDate ?? null,
      startTime ?? null,
      resolvedReminder,
    ]
  );
  return result.rows[0];
}

async function findAllForUser(userId, { status, priority, search } = {}) {
  const conditions = ["user_id = $1"];
  const params = [userId];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (priority) {
    params.push(priority);
    conditions.push(`priority = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  const result = await db.query(
    `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
}

async function findByIdForUser(id, userId) {
  const result = await db.query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [id, userId]);
  return result.rows[0] || null;
}

async function updateForUser(id, userId, fields) {
  const allowed = [
    "title",
    "description",
    "status",
    "priority",
    "due_date",
    "start_time",
    "reminder_minutes",
    "reminder_sent_at",
  ];
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key) || value === undefined) continue;
    params.push(value);
    setClauses.push(`${key} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return findByIdForUser(id, userId);
  }

  setClauses.push("updated_at = now()");
  params.push(id);
  params.push(userId);

  const result = await db.query(
    `UPDATE tasks SET ${setClauses.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function deleteForUser(id, userId) {
  const result = await db.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id", [
    id,
    userId,
  ]);
  return result.rows[0] || null;
}

// Reminders due right now, across all users - used by the background scheduler.
// Bounded to an hour past start_time so a long backend outage doesn't dump a
// backlog of stale pushes once it comes back up.
async function findDueReminders() {
  const result = await db.query(
    `SELECT * FROM tasks
     WHERE start_time IS NOT NULL
       AND reminder_minutes IS NOT NULL
       AND reminder_sent_at IS NULL
       AND status != 'completed'
       AND now() >= start_time - (reminder_minutes || ' minutes')::interval
       AND now() < start_time + interval '1 hour'`
  );
  return result.rows;
}

async function markReminderSent(id) {
  await db.query("UPDATE tasks SET reminder_sent_at = now() WHERE id = $1", [id]);
}

module.exports = {
  createTask,
  findAllForUser,
  findByIdForUser,
  updateForUser,
  deleteForUser,
  findDueReminders,
  markReminderSent,
};
