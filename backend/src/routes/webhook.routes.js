const express = require("express");
const { paystackWebhook, shankaWebhook } = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/paystack", paystackWebhook);
router.post("/shanka", shankaWebhook);

module.exports = router;
