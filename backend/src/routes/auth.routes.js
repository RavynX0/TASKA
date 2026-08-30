const express = require("express");
const authController = require("../controllers/auth.controller");
const { validateRegister, validateLogin } = require("../validators/auth.validators");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/preferences", requireAuth, authController.updatePreferences);

module.exports = router;
