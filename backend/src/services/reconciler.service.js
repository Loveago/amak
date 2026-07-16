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

/**
 * Resolves the Paystack reference for an order using three strategies:
 *
 * 1. If the order has a paymentRef, look up that exact Payment record.
 * 2. If the order has associated payments (via the `payments` relation),
 *    use the most recent ORDER-type payment reference.
 * 3. Fall back to querying for the latest ORDER payment linked by orderId.
 */
async function resolveOrderPaymentReference(order) {
  // Strategy 1: Use the paymentRef stored directly on the order
  if (order.paymentRef) {
    const payment = await prisma.payment.findUnique({
      where: { reference: order.paymentRef }
    });
    if (payment && payment.type === "ORDER" && payment.orderId === order.id) {
      return String(payment.reference).trim();
    }
  }

  // Strategy 2: Look for the latest ORDER payment linked via the `payments` relation
  if (order.payments && order.payments.length > 0) {
    const orderPayments = order.payments
      .filter((p) => p.type === "ORDER")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (orderPayments.length > 0) {
      return String(orderPayments[0].reference).trim();
    }
  }

  // Strategy 3: Query for any ORDER payment linked to this order
  const latestOrderPayment = await prisma.payment.findFirst({
    where: { orderId: order.id, type: "ORDER" },
    orderBy: { createdAt: "desc" }
  });

  return String(latestOrderPayment?.reference || "").trim();
}

/**
 * Reconciles a single unpaid order.
 *
 * 1. Verifies the Paystack transaction (the fallback source of truth).
 * 2. If the transaction succeeded, marks the payment as VERIFIED.
 * 3. Calls settleOrderPayment which transitions the order from CREATED → PAID
 *    and dispatches it to the active provider for processing.
 */
async function reconcileOrder(order) {
  if (!order || order.status !== "CREATED") {
    return { orderId: order?.id, reconciled: false, reason: "not_unpaid" };
  }

  const reference = await resolveOrderPaymentReference(order);
  if (!reference) {
    return { orderId: order.id, reconciled: false, reason: "no_reference" };
  }

  let verification;
  try {
    verification = await verifyTransaction(reference);
  } catch (error) {
    logger.warn(
      `Reconciler: Paystack verify failed for order ${order.id} (ref=${reference}): ${error.message}`
    );
    return { orderId: order.id, reference, reconciled: false, reason: "verify_error", error: error.message };
  }

  if (!verification) {
    return { orderId: order.id, reference, reconciled: false, reason: "verification_empty" };
  }

  const paystackStatus = String(verification.status || "").toLowerCase();
  if (paystackStatus !== "success") {
    return {
      orderId: order.id,
      reference,
      reconciled: false,
      paystackStatus: paystackStatus || "unknown",
      reason: "paystack_not_success"
    };
  }

  // Mark the payment as VERIFIED in our DB
  await markPaymentVerified(reference, verification.metadata || {}, verification);

  // Refresh the order after markPaymentVerified (it may have already called settleOrderPayment)
  let refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (refreshedOrder?.status === "CREATED") {
    // settleOrderPayment was NOT called by markPaymentVerified → call it now
    await settleOrderPayment(order.id, reference);
    refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  }

  // Record that the auto-reconciler handled this order
  await prisma.order.update({
    where: { id: order.id },
    data: { autoReconciledAt: new Date() }
  });

  logger.info(
    `Reconciler: order ${order.id} settled via Paystack (ref=${reference}, ` +
      `status=${refreshedOrder?.status || "?"}, provider=${refreshedOrder?.providerStatus || "?"})`
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

/**
 * Finds every unpaid order placed after activation and attempts to reconcile it.
 *
 * Unlike the previous implementation, this query also matches orders that have
 * associated Payment records (via the `payments` relation) even when their
 * `paymentRef` column is NULL. This covers cases where the payment reference
 * was not propagated back to the order record.
 */
async function runReconciliation({ batchSize = 25 } = {}) {
  const config = await ensureReconcilerActive();
  const activatedAt = config.activatedAt;

  const orders = await prisma.order.findMany({
    where: {
      status: "CREATED",
      createdAt: { gte: activatedAt },
      OR: [
        { paymentRef: { not: null } },
        { payments: { some: { type: "ORDER" } } }
      ]
    },
    include: { payments: true },
    orderBy: { createdAt: "asc" },
    take: batchSize
  });

  if (orders.length === 0) {
    return [];
  }

  const results = [];
  for (const order of orders) {
    try {
      results.push(await reconcileOrder(order));
    } catch (error) {
      logger.error(`Reconciler unexpected error for order ${order.id}: ${error.message}`);
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
