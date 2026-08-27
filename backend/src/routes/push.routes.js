const express = require("express");
const pushController = require("../controllers/push.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateSubscribe, validateUnsubscribe } = require("../validators/push.validators");

const router = express.Router();

router.get("/vapid-public-key", pushController.getPublicKey);
router.post("/subscribe", requireAuth, validateSubscribe, pushController.subscribe);
router.delete("/subscribe", requireAuth, validateUnsubscribe, pushController.unsubscribe);

module.exports = router;
