const app = require("./app");
const config = require("./config/env");
const { startReminderScheduler } = require("./jobs/reminderScheduler");
const { runMigrations } = require("./db/migrate");

async function start() {
  // Apply any pending migrations against whatever DB this process connects to,
  // so the schema can never drift out from under the running server.
  try {
    await runMigrations();
  } catch (err) {
    console.error("Migration on startup failed:", err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`TASKA Server is running on http://localhost:${config.port}`);
    startReminderScheduler();
  });
}

start();
