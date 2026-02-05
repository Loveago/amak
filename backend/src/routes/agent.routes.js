const express = require("express");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const {
  dashboard,
  getProfile,
  updateProfile,
  listAffiliatePricing,
  updateAffiliatePricing,
  listProducts,
  updateAgentProduct,
  wallet,
  createWithdrawal,
  listWithdrawals,
  listOrders,
  affiliate,
  subscription,
  listPlans,
  getAfaConfig,
  listAfaRegistrations
} = require("../controllers/agent.controller");

const router = express.Router();

router.use(authenticate, requireRole("AGENT"));

router.get("/dashboard", dashboard);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.get("/affiliate-pricing", listAffiliatePricing);
router.put("/affiliate-pricing/:productId", updateAffiliatePricing);
router.get("/products", listProducts);
router.put("/products/:productId", updateAgentProduct);
router.get("/wallet", wallet);
router.post("/withdrawals", createWithdrawal);
router.get("/withdrawals", listWithdrawals);
router.get("/orders", listOrders);
router.get("/affiliate", affiliate);
router.get("/subscription", subscription);
router.get("/plans", listPlans);
router.get("/afa/config", getAfaConfig);
router.get("/afa-registrations", listAfaRegistrations);

module.exports = router;
