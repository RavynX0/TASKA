const express = require("express");
const taskController = require("../controllers/task.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  validateId,
  validateCreateTask,
  validateUpdateTask,
  validateStatusUpdate,
  validateListQuery,
} = require("../validators/task.validators");

const router = express.Router();

router.use(requireAuth);

router.post("/", validateCreateTask, taskController.createTask);
router.get("/", validateListQuery, taskController.listTasks);
router.get("/:id", validateId, taskController.getTask);
router.put("/:id", validateId, validateUpdateTask, taskController.updateTask);
router.patch("/:id", validateId, validateUpdateTask, taskController.updateTask);
router.patch("/:id/status", validateId, validateStatusUpdate, taskController.updateTaskStatus);
router.delete("/:id", validateId, taskController.deleteTask);

module.exports = router;
