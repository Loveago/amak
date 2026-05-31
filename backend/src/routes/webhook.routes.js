const express = require("express");
const { paystackWebhook, shankaWebhook, xpressWebhook } = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/paystack", paystackWebhook);
router.post("/shanka", shankaWebhook);
router.post("/xpress", xpressWebhook);

module.exports = router;
