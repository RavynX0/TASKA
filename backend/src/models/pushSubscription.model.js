const db = require("../config/db");

async function upsertSubscription({ userId, endpoint, p256dh, auth }) {
  const result = await db.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4
     RETURNING *`,
    [userId, endpoint, p256dh, auth]
  );
  return result.rows[0];
}

async function deleteByEndpoint(endpoint, userId) {
  await db.query("DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2", [
    endpoint,
    userId,
  ]);
}

async function deleteByEndpointOnly(endpoint) {
  await db.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
}

async function findAllForUser(userId) {
  const result = await db.query("SELECT * FROM push_subscriptions WHERE user_id = $1", [userId]);
  return result.rows;
}

module.exports = { upsertSubscription, deleteByEndpoint, deleteByEndpointOnly, findAllForUser };
