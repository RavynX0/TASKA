const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const pushRoutes = require("./routes/push.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    message: "TASKA API is running",
  });
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/push", pushRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
