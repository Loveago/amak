const express = require("express");
const authRoutes = require("./auth.routes");
const storeRoutes = require("./store.routes");
const agentRoutes = require("./agent.routes");
const adminRoutes = require("./admin.routes");
const paymentRoutes = require("./payment.routes");
const webhookRoutes = require("./webhook.routes");
const uploadRoutes = require("./upload.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/store", storeRoutes);
router.use("/agent", agentRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/uploads", uploadRoutes);

module.exports = router;
