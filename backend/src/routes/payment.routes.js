const express = require("express");
const {
  initializeOrderPayment,
  initializeSubscription,
  initializeAfaRegistration,
  initializeWalletTopup,
  verifyPayment
} = require("../controllers/payment.controller");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/rbac");

const router = express.Router();

router.post("/orders/initialize", initializeOrderPayment);
router.post("/subscriptions/initialize", authenticate, requireRole("AGENT"), initializeSubscription);
router.post("/afa-registrations/initialize", authenticate, requireRole("AGENT"), initializeAfaRegistration);
router.post("/wallet-topup/initialize", authenticate, requireRole("AGENT"), initializeWalletTopup);
router.post("/verify", verifyPayment);

module.exports = router;
