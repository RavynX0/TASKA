const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query("SELECT name FROM schema_migrations");
  return new Set(result.rows.map((row) => row.name));
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Applying migration: ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed (${file}): ${err.message}`);
      }
    }

    console.log("Migrations up to date.");
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = { runMigrations };
