const express = require("express");
const { paystackWebhook } = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/paystack", paystackWebhook);

module.exports = router;
