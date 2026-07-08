const prisma = require("../config/prisma");
const logger = require("../config/logger");
const { verifyTransaction } = require("./paystack.service");
const { markPaymentVerified } = require("./payment.service");
const { settleOrderPayment } = require("./order.service");

const CONFIG_ID = "default";

// Ensures a persisted activation timestamp exists. The first time the
// reconciler ever runs, this locks in the "became active" moment so that any
// order created before that point is left untouched forever.
async function ensureReconcilerActive() {
  const config = await prisma.reconcilerConfig.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID }
  });
  return config;
}

async function getReconcilerConfig() {
  return prisma.reconcilerConfig.findUnique({ where: { id: CONFIG_ID } });
}

// Resolves the Paystack reference associated with an order, preferring the
// reference stored on the order, then falling back to the latest ORDER payment.
async function resolveOrderPaymentReference(order) {
  const paymentByOrderRef = order.paymentRef
    ? await prisma.payment.findUnique({ where: { reference: order.paymentRef } })
    : null;

  const latestOrderPayment = await prisma.payment.findFirst({
    where: { orderId: order.id, type: "ORDER" },
    orderBy: { createdAt: "desc" }
  });

  const payment =
    paymentByOrderRef && paymentByOrderRef.type === "ORDER" && paymentByOrderRef.orderId === order.id
      ? paymentByOrderRef
      : latestOrderPayment;

  return String(payment?.reference || "").trim();
}

// Reconciles a single unpaid order: verifies the Paystack reference (the
// fallback source of truth) and, if the transaction succeeded, marks the order
// as paid and dispatches it to the active provider for processing.
async function reconcileOrder(order) {
  if (!order || order.status !== "CREATED") {
    return { orderId: order?.id, reconciled: false, reason: "not_unpaid" };
  }

  const reference = await resolveOrderPaymentReference(order);
  if (!reference) {
    return { orderId: order.id, reconciled: false, reason: "no_reference" };
  }

  const verification = await verifyTransaction(reference);
  const paystackStatus = String(verification?.status || "").toLowerCase();
  if (paystackStatus !== "success") {
    return { orderId: order.id, reference, reconciled: false, paystackStatus: paystackStatus || "unknown" };
  }

  await markPaymentVerified(reference, verification.metadata || {}, verification);

  let refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (refreshedOrder?.status === "CREATED") {
    await settleOrderPayment(order.id, reference);
    refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { autoReconciledAt: new Date() }
  });

  logger.info(
    `Reconciler: order ${order.id} settled via Paystack (ref=${reference}, status=${refreshedOrder?.status || "?"}, provider=${refreshedOrder?.providerStatus || "?"})`
  );

  return {
    orderId: order.id,
    reference,
    reconciled: true,
    paystackStatus,
    orderStatus: refreshedOrder?.status || null,
    providerStatus: refreshedOrder?.providerStatus || null
  };
}

// Finds every unpaid order placed after activation and attempts to reconcile it.
async function runReconciliation({ batchSize = 25 } = {}) {
  const config = await ensureReconcilerActive();
  const activatedAt = config.activatedAt;

  const orders = await prisma.order.findMany({
    where: {
      status: "CREATED",
      paymentRef: { not: null },
      createdAt: { gte: activatedAt }
    },
    orderBy: { createdAt: "asc" },
    take: batchSize
  });

  const results = [];
  for (const order of orders) {
    try {
      results.push(await reconcileOrder(order));
    } catch (error) {
      logger.error(`Reconciler error for order ${order.id}: ${error.message}`);
      results.push({ orderId: order.id, reconciled: false, error: error.message });
    }
  }
  return results;
}

module.exports = {
  ensureReconcilerActive,
  getReconcilerConfig,
  reconcileOrder,
  runReconciliation
};
