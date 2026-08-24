const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
  console.log(`TASKA Server is running on http://localhost:${config.port}`);
});
