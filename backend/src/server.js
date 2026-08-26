const app = require("./app");
const config = require("./config/env");
const { startReminderScheduler } = require("./jobs/reminderScheduler");

app.listen(config.port, () => {
  console.log(`TASKA Server is running on http://localhost:${config.port}`);
  startReminderScheduler();
});
