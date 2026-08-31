const db = require("../config/db");

// Kept generic via `purpose` so the same table can hold password-reset codes
// later without the two flows sharing rows.
const EMAIL_VERIFICATION = "email_verification";

// Replace any existing code for this user/purpose with a fresh one. A resend
// therefore always invalidates the previous code.
async function replaceForUser(userId, codeHash, expiresAt, purpose = EMAIL_VERIFICATION) {
  await db.query("DELETE FROM email_verifications WHERE user_id = $1 AND purpose = $2", [
    userId,
    purpose,
  ]);
  const result = await db.query(
    `INSERT INTO email_verifications (user_id, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, purpose, codeHash, expiresAt]
  );
  return result.rows[0];
}

async function findActive(userId, purpose = EMAIL_VERIFICATION) {
  const result = await db.query(
    `SELECT * FROM email_verifications
     WHERE user_id = $1 AND purpose = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, purpose]
  );
  return result.rows[0] || null;
}

async function incrementAttempts(id) {
  const result = await db.query(
    "UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts",
    [id]
  );
  return result.rows[0] ? result.rows[0].attempts : null;
}

async function deleteForUser(userId, purpose = EMAIL_VERIFICATION) {
  await db.query("DELETE FROM email_verifications WHERE user_id = $1 AND purpose = $2", [
    userId,
    purpose,
  ]);
}

module.exports = {
  EMAIL_VERIFICATION,
  replaceForUser,
  findActive,
  incrementAttempts,
  deleteForUser,
};
