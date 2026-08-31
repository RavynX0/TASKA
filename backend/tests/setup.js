process.env.NODE_ENV = "test";

const { runMigrations } = require("../src/db/migrate");
const { pool } = require("../src/config/db");

beforeAll(async () => {
  await runMigrations();
});

beforeEach(async () => {
  await pool.query(
    "TRUNCATE TABLE email_verifications, tasks, users RESTART IDENTITY CASCADE"
  );
});

afterAll(async () => {
  await pool.end();
});
