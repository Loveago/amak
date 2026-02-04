const crypto = require("crypto");
const prisma = require("../config/prisma");
const env = require("../config/env");
const { recordPaymentEvent, markPaymentVerified } = require("../services/payment.service");

async function paystackWebhook(req, res, next) {
  try {
    const signature = req.headers["x-paystack-signature"];
    if (!signature) {
      return res.status(400).json({ success: false, error: "Missing signature" });
    }

    const computed = crypto
      .createHmac("sha512", env.paystackWebhookSecret)
      .update(req.rawBody || "")
      .digest("hex");

    if (computed !== signature) {
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    const event = req.body;
    const eventId = event?.data?.id || event?.event || `event_${Date.now()}`;
    const reference = event?.data?.reference;

    const recorded = await recordPaymentEvent(eventId, event, reference);
    if (!recorded) {
      return res.json({ success: true, data: { received: true, duplicate: true } });
    }

    if (event.event === "charge.success") {
      await markPaymentVerified(reference, event.data?.metadata || {});
    }

    return res.json({ success: true, data: { received: true } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { paystackWebhook };
