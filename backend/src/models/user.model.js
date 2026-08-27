const db = require("../config/db");

const PUBLIC_COLUMNS = "id, name, email, created_at, updated_at";

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

module.exports = { createUser, findByEmail, findById };
