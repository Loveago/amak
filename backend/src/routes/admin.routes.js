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
  deleteProduct,
  disableProduct,
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
  listReconciledOrders,
  exportOrders,
  fulfillOrder,
  recheckOrderPayment,
  updateFailedOrderProvider,
  resendFailedOrder,
  fulfillOrdersByHour,
  deleteOrder,
  listSubscriptions,
  listWithdrawals,
  updateWithdrawal,
  adjustWallet,
  listPayments,
  listWalletDeposits,
  listAuditLogs,
  updateAfaConfig,
  listAfaRegistrations,
  updateAfaRegistrationStatus,
  deleteAgent,
  getProviderConfigEndpoint,
  updateProviderConfig,
  getProviderBalance,
  listApiAccessRequests,
  updateApiAccessRequest,
  bulkUpdateOrders,
  listOrdersForBulk
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
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/status", disableProduct);
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
router.get("/orders/bulk", listOrdersForBulk);
router.patch("/orders/bulk/status", bulkUpdateOrders);
router.get("/orders/reconciled", listReconciledOrders);
router.get("/orders/export", exportOrders);
router.patch("/orders/:id/fulfill", fulfillOrder);
router.post("/orders/:id/recheck-payment", recheckOrderPayment);
router.patch("/orders/:id/provider", updateFailedOrderProvider);
router.post("/orders/:id/resend", resendFailedOrder);
router.patch("/orders/fulfill-hour", fulfillOrdersByHour);
router.delete("/orders/:id", deleteOrder);
router.get("/subscriptions", listSubscriptions);
router.get("/withdrawals", listWithdrawals);
router.patch("/withdrawals/:id", updateWithdrawal);
router.post("/wallets/adjustments", adjustWallet);
router.get("/payments", listPayments);
router.get("/wallet-deposits", listWalletDeposits);
router.get("/afa-registrations", listAfaRegistrations);
router.patch("/afa-registrations/:id", updateAfaRegistrationStatus);
router.get("/logs", listAuditLogs);
router.get("/provider", getProviderConfigEndpoint);
router.patch("/provider", updateProviderConfig);
router.get("/provider/balance", getProviderBalance);
router.get("/api-access-requests", listApiAccessRequests);
router.patch("/api-access-requests/:id", updateApiAccessRequest);

module.exports = router;
