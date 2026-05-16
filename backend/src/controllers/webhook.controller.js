const crypto = require("crypto");
const env = require("../config/env");
const prisma = require("../config/prisma");
const { recordPaymentEvent, markPaymentVerified } = require("../services/payment.service");
const { ensureOrderWalletCredits } = require("../services/order.service");
const { normalizeStatus: normalizeShankaStatus } = require("../services/shanka.service");

const SHANKA_DELIVERED_STATUSES = new Set(["DELIVERED", "COMPLETED", "SUCCESS"]);

function timingSafeCompare(signature, computed) {
  const sigBuffer = Buffer.from(signature);
  const computedBuffer = Buffer.from(computed);
  if (sigBuffer.length !== computedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuffer, computedBuffer);
}

function collectShankaUpdates(payload) {
  const updates = [];
  if (!payload || typeof payload !== "object") return updates;

  const rootReference =
    payload.reference || payload.order_reference || payload.orderReference || payload.ref || null;
  if (rootReference) {
    updates.push({ reference: String(rootReference), status: payload.status || payload.api_status || null });
  }

  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.orders)
      ? payload.orders
      : [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const reference =
      item.order_reference || item.orderReference || item.reference || item.order_code || item.orderCode;
    if (!reference) continue;
    updates.push({ reference: String(reference), status: item.api_status ?? item.status ?? null });
  }

  return updates;
}

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

    if (event.event === "charge.success" && reference) {
      await markPaymentVerified(reference, event.data?.metadata || {}, event.data || {});
    }

    return res.json({ success: true, data: { received: true } });
  } catch (error) {
    return next(error);
  }
}

async function shankaWebhook(req, res, next) {
  try {
    const signatureHeader = req.headers["x-skanka5-signature"];
    if (!signatureHeader) {
      return res.status(400).json({ success: false, error: "Missing signature" });
    }

    if (!env.shankaWebhookSecret) {
      return res.status(500).json({ success: false, error: "Shanka webhook secret not configured" });
    }

    const signature = String(signatureHeader).replace(/^sha256=/i, "").trim();
    const computed = crypto
      .createHmac("sha256", env.shankaWebhookSecret)
      .update(req.rawBody || "")
      .digest("hex");

    if (!timingSafeCompare(signature, computed)) {
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    const payload = req.body;
    const updates = collectShankaUpdates(payload);
    const results = [];

    for (const update of updates) {
      const order = await prisma.order.findFirst({
        where: { providerReference: update.reference },
        include: { items: { include: { product: { include: { category: true } } } } }
      });

      if (!order) {
        results.push({ reference: update.reference, matched: false });
        continue;
      }

      const normalized = normalizeShankaStatus(update.status) || normalizeShankaStatus(payload?.status);
      const providerStatus = normalized || order.providerStatus || null;
      const delivered = providerStatus && SHANKA_DELIVERED_STATUSES.has(providerStatus);

      const data = {
        providerStatus,
        providerLastCheckedAt: new Date(),
        providerPayload: {
          ...(order.providerPayload || {}),
          provider: "SHANKA",
          webhook: payload
        }
      };

      if (delivered) {
        data.status = "FULFILLED";
      }

      await prisma.order.update({ where: { id: order.id }, data });

      if (delivered && order.status === "FAILED") {
        await ensureOrderWalletCredits({ ...order, status: data.status || order.status });
      }

      results.push({ reference: update.reference, matched: true, status: providerStatus });
    }

    return res.json({ success: true, data: { received: true, updates: results } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { paystackWebhook, shankaWebhook };
