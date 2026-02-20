const prisma = require("../config/prisma");
const { settleOrderPayment } = require("./order.service");
const { activateSubscription } = require("./subscription.service");
const { creditWallet } = require("./wallet.service");

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

async function markPaymentVerified(reference, metadata) {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) {
    return null;
  }
  if (payment.status === "VERIFIED") {
    return payment;
  }

  const updated = await prisma.payment.update({
    where: { reference },
    data: { status: "VERIFIED", metadata: metadata || payment.metadata }
  });

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
    await creditWallet({
      agentId: updated.agentId,
      amountGhs: subtotalGhs,
      type: "TOP_UP",
      reference,
      metadata: { paymentId: updated.id }
    });
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
