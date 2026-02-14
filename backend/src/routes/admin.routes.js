const express = require("express");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const {
  dashboard,
  getSettings,
  listCategories,
  createCategory,
  updateCategory,
  listProducts,
  createProduct,
  updateProduct,
  listPlans,
  createPlan,
  updatePlan,
  listAgents,
  listWallets,
  listAffiliates,
  updateAgentStatus,
  updateAgentProfile,
  updateAgentPassword,
  updateAgentWallet,
  updateAgentSubscription,
  listOrders,
  fulfillOrder,
  listSubscriptions,
  listWithdrawals,
  updateWithdrawal,
  adjustWallet,
  listPayments,
  listAuditLogs,
  updateAfaConfig,
  listAfaRegistrations,
  updateAfaRegistrationStatus,
  deleteAgent,
  getProviderConfigEndpoint,
  updateProviderConfig,
  getProviderBalance
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/dashboard", dashboard);
router.get("/settings", getSettings);
router.patch("/settings/afa", updateAfaConfig);
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.get("/products", listProducts);
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.patch("/plans/:id", updatePlan);
router.get("/agents", listAgents);
router.get("/wallets", listWallets);
router.get("/affiliates", listAffiliates);
router.patch("/agents/:id/status", updateAgentStatus);
router.patch("/agents/:id", updateAgentProfile);
router.patch("/agents/:id/password", updateAgentPassword);
router.patch("/agents/:id/wallet", updateAgentWallet);
router.patch("/agents/:id/subscription", updateAgentSubscription);
router.delete("/agents/:id", deleteAgent);
router.get("/orders", listOrders);
router.patch("/orders/:id/fulfill", fulfillOrder);
router.get("/subscriptions", listSubscriptions);
router.get("/withdrawals", listWithdrawals);
router.patch("/withdrawals/:id", updateWithdrawal);
router.post("/wallets/adjustments", adjustWallet);
router.get("/payments", listPayments);
router.get("/afa-registrations", listAfaRegistrations);
router.patch("/afa-registrations/:id", updateAfaRegistrationStatus);
router.get("/logs", listAuditLogs);
router.get("/provider", getProviderConfigEndpoint);
router.patch("/provider", updateProviderConfig);
router.get("/provider/balance", getProviderBalance);

module.exports = router;
