const db = require("../config/db");

const PUBLIC_COLUMNS =
  "id, name, email, notification_preferences, created_at, updated_at";

// Server-enforced notification toggles and their defaults. Anything the client
// sends that isn't in here is ignored; anything missing falls back to `true`.
const PREFERENCE_DEFAULTS = {
  startTimeNotifications: true,
  followUpNotifications: true,
  missedTaskNotifications: true,
};

async function createUser({ name, email, passwordHash }) {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

function resolvePreferences(raw) {
  return { ...PREFERENCE_DEFAULTS, ...(raw || {}) };
}

async function updatePreferences(id, patch) {
  const clean = {};
  for (const key of Object.keys(PREFERENCE_DEFAULTS)) {
    if (typeof patch[key] === "boolean") clean[key] = patch[key];
  }
  const result = await db.query(
    `UPDATE users
     SET notification_preferences = notification_preferences || $2::jsonb,
         updated_at = now()
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [id, JSON.stringify(clean)]
  );
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updatePreferences,
  resolvePreferences,
  PREFERENCE_DEFAULTS,
};
