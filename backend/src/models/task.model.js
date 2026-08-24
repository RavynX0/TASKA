const db = require("../config/db");

async function createTask({ userId, title, description, status, priority, dueDate }) {
  const result = await db.query(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
     VALUES ($1, $2, $3, COALESCE($4::task_status, 'pending'), COALESCE($5::task_priority, 'medium'), $6)
     RETURNING *`,
    [userId, title, description ?? null, status, priority, dueDate ?? null]
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
  const allowed = ["title", "description", "status", "priority", "due_date"];
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

module.exports = { createTask, findAllForUser, findByIdForUser, updateForUser, deleteForUser };
