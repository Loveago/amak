const prisma = require("../config/prisma");
const logger = require("../config/logger");
const env = require("../config/env");
const { verifyTransaction } = require("./paystack.service");
const { markPaymentVerified } = require("./payment.service");
const { settleOrderPayment } = require("./order.service");

const CONFIG_ID = "default";
const isAdminManualPaymentRef = (paymentRef) => String(paymentRef || "").startsWith("ADMIN_MANUAL_");

// Cutover is process boot time: every backend restart starts a fresh window.
// Orders created before this process started are never auto-reconciled.
const PROCESS_STARTED_AT = new Date();
let bootstrappedActivation = false;

// Persists the current process boot time as activatedAt (for admin visibility).
// Selection itself uses in-memory PROCESS_STARTED_AT so restarts always mean "now".
async function ensureReconcilerActive() {
  if (!bootstrappedActivation) {
    const config = await prisma.reconcilerConfig.upsert({
      where: { id: CONFIG_ID },
      update: { activatedAt: PROCESS_STARTED_AT },
      create: { id: CONFIG_ID, activatedAt: PROCESS_STARTED_AT }
    });
    bootstrappedActivation = true;
    return config;
  }

  return (
    (await prisma.reconcilerConfig.findUnique({ where: { id: CONFIG_ID } })) || {
      id: CONFIG_ID,
      activatedAt: PROCESS_STARTED_AT
    }
  );
}

async function getReconcilerConfig() {
  return prisma.reconcilerConfig.findUnique({ where: { id: CONFIG_ID } });
}

/**
 * Effective cutover floor for order selection.
 *
 * Default: this process's start time (every backend restart = now).
 * Optional RECONCILER_ACTIVATED_AT may only RAISE that floor further.
 */
function resolveActivationFloor(_config) {
  let floor = PROCESS_STARTED_AT;

  const rawEnv = String(env.reconcilerActivatedAt || "").trim();
  if (rawEnv) {
    const fromEnv = new Date(rawEnv);
    if (!Number.isNaN(fromEnv.getTime()) && fromEnv.getTime() > floor.getTime()) {
      floor = fromEnv;
    }
  }

  return floor;
}

/**
 * Resolves the Paystack reference for an order using several strategies:
 *
 * 1. If the order has a paymentRef that maps to an ORDER payment, use it.
 * 2. If the order has associated payments (via the `payments` relation),
 *    use the most recent ORDER-type payment reference.
 * 3. Fall back to querying for the latest ORDER payment linked by orderId.
 * 4. Fall back to the raw order.paymentRef when it looks like a Paystack ref
 *    (covers missing/mismatched Payment rows without losing the reference).
 */
async function resolveOrderPaymentReference(order) {
  // Strategy 1: Use the paymentRef stored directly on the order
  if (order.paymentRef && !isAdminManualPaymentRef(order.paymentRef)) {
    const payment = await prisma.payment.findUnique({
      where: { reference: order.paymentRef }
    });
    if (payment && payment.type === "ORDER" && payment.orderId === order.id) {
      return { reference: String(payment.reference).trim(), payment };
    }
  }

  // Strategy 2: Look for the latest ORDER payment linked via the `payments` relation
  if (order.payments && order.payments.length > 0) {
    const orderPayments = order.payments
      .filter((p) => p.type === "ORDER" && !isAdminManualPaymentRef(p.reference))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (orderPayments.length > 0) {
      return { reference: String(orderPayments[0].reference).trim(), payment: orderPayments[0] };
    }
  }

  // Strategy 3: Query for any ORDER payment linked to this order
  const latestOrderPayment = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      type: "ORDER",
      NOT: { reference: { startsWith: "ADMIN_MANUAL_" } }
    },
    orderBy: { createdAt: "desc" }
  });

  if (latestOrderPayment?.reference) {
    return {
      reference: String(latestOrderPayment.reference).trim(),
      payment: latestOrderPayment
    };
  }

  // Strategy 4: Use paymentRef as-is when it is a non-manual Paystack reference
  if (order.paymentRef && !isAdminManualPaymentRef(order.paymentRef)) {
    return { reference: String(order.paymentRef).trim(), payment: null };
  }

  return { reference: "", payment: null };
}

/**
 * Reconciles a single unpaid order.
 *
 * 1. Prefer local VERIFIED payments (settle immediately without Paystack).
 * 2. Otherwise verify the Paystack transaction (fallback source of truth).
 * 3. If the transaction succeeded, mark the payment as VERIFIED.
 * 4. Call settleOrderPayment which transitions the order from CREATED → PAID
 *    and dispatches it to the active provider for processing.
 */
async function reconcileOrder(order) {
  if (!order || order.status !== "CREATED") {
    return { orderId: order?.id, reconciled: false, reason: "not_unpaid" };
  }

  if (isAdminManualPaymentRef(order.paymentRef)) {
    return { orderId: order.id, reconciled: false, reason: "manual_payment_ref" };
  }

  const { reference, payment } = await resolveOrderPaymentReference(order);
  if (!reference) {
    return { orderId: order.id, reconciled: false, reason: "no_reference" };
  }

  // Fast path: payment already verified locally but order never settled
  // (e.g. settleOrderPayment failed after webhook/callback verification).
  if (payment?.status === "VERIFIED") {
    let refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    if (refreshedOrder?.status === "CREATED") {
      await settleOrderPayment(order.id, reference);
      refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    }

    if (refreshedOrder?.status === "CREATED") {
      return {
        orderId: order.id,
        reference,
        reconciled: false,
        reason: "settle_failed_after_verified"
      };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { autoReconciledAt: new Date() }
    });

    logger.info(
      `Reconciler: order ${order.id} settled from VERIFIED payment (ref=${reference}, ` +
        `status=${refreshedOrder?.status || "?"}, provider=${refreshedOrder?.providerStatus || "?"})`
    );

    return {
      orderId: order.id,
      reference,
      reconciled: true,
      paystackStatus: "already_verified",
      orderStatus: refreshedOrder?.status || null,
      providerStatus: refreshedOrder?.providerStatus || null
    };
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

  // Mark the payment as VERIFIED in our DB (also settles when payment row exists)
  try {
    await markPaymentVerified(reference, verification.metadata || {}, verification);
  } catch (error) {
    // Payment row may be missing, or amount validation may fail. Still attempt settle
    // when Paystack confirms success so the order is not left CREATED forever.
    logger.warn(
      `Reconciler: markPaymentVerified failed for order ${order.id} (ref=${reference}): ${error.message}`
    );
  }

  // Refresh the order after markPaymentVerified (it may have already called settleOrderPayment)
  let refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (refreshedOrder?.status === "CREATED") {
    // settleOrderPayment was NOT called by markPaymentVerified → call it now
    await settleOrderPayment(order.id, reference);
    refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
  }

  if (refreshedOrder?.status === "CREATED") {
    return {
      orderId: order.id,
      reference,
      reconciled: false,
      paystackStatus,
      reason: "settle_failed"
    };
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
 * Finds unpaid orders that are eligible for automatic Paystack reconciliation.
 *
 * HARD RULE: never touch orders created before this process started.
 * Every backend restart becomes the cutover ("now"), so already-settled history
 * from previous runs cannot be re-checked or re-submitted.
 *
 * Within the post-restart window:
 * - Skip brand-new orders (min age) so webhook/callback can finish first.
 * - Bound lookback (max age) so abandoned carts cannot monopolize the batch.
 * - Prefer newest eligible orders so recent paid-but-stuck checkouts recover first.
 * - Prefer VERIFIED-but-still-CREATED payments (settle without another Paystack call).
 */
async function runReconciliation({ batchSize } = {}) {
  const config = await ensureReconcilerActive();
  const activationFloor = resolveActivationFloor(config);
  if (!activationFloor) {
    logger.warn("Reconciler: missing activation floor — refusing to scan orders");
    return [];
  }

  const now = Date.now();
  const minAgeMs = Number(env.reconcilerMinAgeMs || 120000);
  const maxAgeMs = Number(env.reconcilerMaxAgeMs || 7 * 24 * 60 * 60 * 1000);
  const take = Number.isFinite(Number(batchSize))
    ? Math.max(1, Number(batchSize))
    : Number(env.reconcilerBatchSize || 50);

  // Absolute floor: only orders placed after activation (DB and/or env override).
  const newestEligible = new Date(now - minAgeMs);
  const oldestByWindow = new Date(now - maxAgeMs);
  // Never go earlier than activationFloor, even if maxAge would allow it.
  const oldestEligible =
    activationFloor.getTime() > oldestByWindow.getTime() ? activationFloor : oldestByWindow;

  // If the entire age window is still before activation, there is nothing safe to scan.
  if (newestEligible.getTime() < activationFloor.getTime()) {
    return [];
  }

  // Phase 1: post-activation CREATED orders whose payment is already VERIFIED.
  const verifiedStuckOrders = await prisma.order.findMany({
    where: {
      status: "CREATED",
      createdAt: {
        gte: activationFloor,
        lte: newestEligible
      },
      payments: { some: { type: "ORDER", status: "VERIFIED" } }
    },
    include: { payments: true },
    orderBy: { createdAt: "desc" },
    take
  });

  // Phase 2: remaining post-activation CREATED orders inside the age window.
  const remainingSlots = Math.max(0, take - verifiedStuckOrders.length);
  const verifiedIds = new Set(verifiedStuckOrders.map((order) => order.id));

  const candidateOrders =
    remainingSlots > 0
      ? await prisma.order.findMany({
          where: {
            status: "CREATED",
            // HARD FLOOR: activatedAt — never rescans pre-activation history.
            createdAt: {
              gte: oldestEligible,
              lte: newestEligible
            },
            OR: [
              {
                AND: [
                  { paymentRef: { not: null } },
                  { NOT: { paymentRef: { startsWith: "ADMIN_MANUAL_" } } }
                ]
              },
              { payments: { some: { type: "ORDER" } } }
            ],
            ...(verifiedIds.size > 0 ? { id: { notIn: Array.from(verifiedIds) } } : {})
          },
          include: { payments: true },
          orderBy: { createdAt: "desc" },
          take: remainingSlots
        })
      : [];

  const orders = [...verifiedStuckOrders, ...candidateOrders];

  if (orders.length === 0) {
    return [];
  }

  const results = [];
  for (const order of orders) {
    // Defense in depth: never reconcile anything created before activation.
    if (new Date(order.createdAt).getTime() < activationFloor.getTime()) {
      results.push({ orderId: order.id, reconciled: false, reason: "before_activation" });
      continue;
    }

    try {
      results.push(await reconcileOrder(order));
    } catch (error) {
      logger.error(`Reconciler unexpected error for order ${order.id}: ${error.message}`);
      results.push({ orderId: order.id, reconciled: false, error: error.message, reason: "unexpected_error" });
    }
  }
  return results;
}

module.exports = {
  ensureReconcilerActive,
  getReconcilerConfig,
  resolveActivationFloor,
  reconcileOrder,
  runReconciliation
};
