const prisma = require("../config/prisma");
const { settleOrderPayment } = require("./order.service");
const { activateSubscription } = require("./subscription.service");
const { creditWallet } = require("./wallet.service");

function toNumeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mergeMetadata(existing, incoming) {
  const safeExisting = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  const safeIncoming = incoming && typeof incoming === "object" && !Array.isArray(incoming) ? incoming : {};
  return { ...safeExisting, ...safeIncoming };
}

function validateVerificationData(payment, reference, verificationData) {
  if (!verificationData || typeof verificationData !== "object") {
    const error = new Error("Missing payment verification data");
    error.statusCode = 400;
    throw error;
  }

  const paidStatus = String(verificationData.status || "").toLowerCase();
  if (paidStatus !== "success") {
    const error = new Error("Payment is not successful");
    error.statusCode = 400;
    throw error;
  }

  const paidReference = String(verificationData.reference || "").trim();
  if (paidReference && paidReference !== reference) {
    const error = new Error("Payment reference mismatch");
    error.statusCode = 400;
    throw error;
  }

  const currency = String(verificationData.currency || "GHS").toUpperCase();
  if (currency !== "GHS") {
    const error = new Error("Unsupported payment currency");
    error.statusCode = 400;
    throw error;
  }

  const paidAmountGhs = toNumeric(verificationData.amount);
  if (!paidAmountGhs || paidAmountGhs <= 0) {
    const error = new Error("Invalid payment amount");
    error.statusCode = 400;
    throw error;
  }

  const expectedAmountGhs = toNumeric(payment.amountGhs);
  const normalizedPaidAmount = paidAmountGhs / 100;
  if (expectedAmountGhs === null || Math.abs(normalizedPaidAmount - expectedAmountGhs) > 0.01) {
    const error = new Error("Payment amount mismatch");
    error.statusCode = 400;
    throw error;
  }
}

function recordPaymentInit({ reference, type, amountGhs, agentId, orderId, planId, afaRegistrationId, metadata }) {
  return prisma.payment.create({
    data: {
      reference,
      type,
      amountGhs,
      agentId,
      orderId,
      planId,
      afaRegistrationId,
      metadata
    }
  });
}

async function markPaymentVerified(reference, metadata, verificationData) {
  const normalizedReference = String(reference || "").trim();
  if (!normalizedReference) {
    const error = new Error("Payment reference is required");
    error.statusCode = 400;
    throw error;
  }

  const payment = await prisma.payment.findUnique({ where: { reference: normalizedReference } });
  if (!payment) {
    return null;
  }

  validateVerificationData(payment, normalizedReference, verificationData);

  if (payment.status === "VERIFIED") {
    return payment;
  }

  const mergedMetadata = mergeMetadata(payment.metadata, metadata || verificationData?.metadata);

  const result = await prisma.payment.updateMany({
    where: { reference: normalizedReference, status: "INITIALIZED" },
    data: { status: "VERIFIED", metadata: mergedMetadata }
  });

  const updated = await prisma.payment.findUnique({ where: { reference: normalizedReference } });
  if (!updated) {
    return null;
  }

  if (result.count === 0) {
    return updated;
  }

  if (updated.type === "ORDER" && updated.orderId) {
    await settleOrderPayment(updated.orderId, reference);
  }

  if (updated.type === "SUBSCRIPTION" && updated.planId && updated.agentId) {
    await activateSubscription(updated.agentId, updated.planId, reference);
  }

  if (updated.type === "AFA_REGISTRATION" && updated.afaRegistrationId) {
    await prisma.afaRegistration.update({
      where: { id: updated.afaRegistrationId },
      data: { status: "SUBMITTED" }
    });
  }

  if (updated.type === "WALLET_TOPUP" && updated.agentId) {
    const subtotalGhs = Number(updated.metadata?.subtotalGhs || updated.amountGhs);
    const wallet = await prisma.wallet.findUnique({ where: { agentId: updated.agentId } });
    if (wallet) {
      const existingTx = await prisma.walletTransaction.findFirst({
        where: { walletId: wallet.id, type: "TOP_UP", reference }
      });
      if (!existingTx) {
        await creditWallet({
          agentId: updated.agentId,
          amountGhs: subtotalGhs,
          type: "TOP_UP",
          reference,
          metadata: { paymentId: updated.id }
        });
      }
    } else {
      await creditWallet({
        agentId: updated.agentId,
        amountGhs: subtotalGhs,
        type: "TOP_UP",
        reference,
        metadata: { paymentId: updated.id }
      });
    }
  }

  return updated;
}

async function recordPaymentEvent(eventId, payload, reference) {
  try {
    await prisma.paymentEvent.create({
      data: {
        eventId,
        payload,
        reference
      }
    });
    return true;
  } catch (error) {
    if (error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

module.exports = {
  recordPaymentInit,
  markPaymentVerified,
  recordPaymentEvent
};
