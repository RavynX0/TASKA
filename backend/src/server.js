const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;

app.get("/health", (req, res) => {
  res.json({
    message: "TASKA API is running",
  });
});

app.post("/tasks", (req, res) => {
  console.log(req.body);

  res.status(201).json({
    message: "TASKA TEST 123",
    task: req.body,
  });
});

app.listen(port, () => {
  console.log(`TASKA Server is running on http://localhost:${port}`);
});
