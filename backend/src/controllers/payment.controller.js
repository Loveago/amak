const prisma = require("../config/prisma");
const {
  initializeOrderPaymentSchema,
  initializeSubscriptionSchema,
  initializeAfaRegistrationSchema
} = require("../validators/payment.validation");
const { validate } = require("../utils/validation");
const { initializeTransaction, verifyTransaction } = require("../services/paystack.service");
const { recordPaymentInit, markPaymentVerified } = require("../services/payment.service");
const { computePaystackGross } = require("../utils/paystack");

async function initializeOrderPayment(req, res, next) {
  try {
    const payload = validate(initializeOrderPaymentSchema, req.body);
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
      include: { agent: { select: { slug: true } } }
    });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    if (order.status === "PAID" || order.status === "FULFILLED") {
      return res.status(400).json({ success: false, error: "Order already paid" });
    }

    const reference = `order_${order.id}_${Date.now()}`;
    const { fee: paystackFeeGhs, gross: paystackGrossGhs } = computePaystackGross(order.totalAmountGhs);
    const baseUrl = process.env.BASE_URL || "";
    const callbackParams = new URLSearchParams({
      orderId: order.id,
      ...(order.agent?.slug ? { slug: order.agent.slug } : {})
    });
    const callbackUrl = `${baseUrl}/checkout/success?${callbackParams.toString()}`;
    const paystackData = await initializeTransaction({
      email: payload.email,
      amountGhs: paystackGrossGhs,
      reference,
      callbackUrl,
      metadata: { type: "order", orderId: order.id, subtotalGhs: order.totalAmountGhs, feeGhs: paystackFeeGhs }
    });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentRef: reference }
      });
      await tx.payment.create({
        data: {
          reference,
          type: "ORDER",
          amountGhs: paystackGrossGhs,
          agentId: order.agentId,
          orderId: order.id,
          metadata: { email: payload.email, subtotalGhs: order.totalAmountGhs, feeGhs: paystackFeeGhs }
        }
      });
    });

    return res.json({ success: true, data: paystackData });
  } catch (error) {
    return next(error);
  }
}

async function initializeAfaRegistration(req, res, next) {
  try {
    const payload = validate(initializeAfaRegistrationSchema, req.body);
    if (!req.user?.sub) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const dateOfBirth = new Date(payload.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid date of birth" });
    }

    const config = await prisma.afaConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", registrationFeeGhs: 20 }
    });
    const feeGhs = Number(config.registrationFeeGhs || 0);

    const reference = `afa_${req.user.sub}_${Date.now()}`;
    const baseUrl = process.env.BASE_URL || "";
    const paystackData = await initializeTransaction({
      email: payload.email,
      amountGhs: feeGhs,
      reference,
      callbackUrl: `${baseUrl}/agent/afa-registration`,
      metadata: { type: "afa_registration" }
    });

    await prisma.$transaction(async (tx) => {
      const registration = await tx.afaRegistration.create({
        data: {
          agentId: req.user.sub,
          fullName: payload.fullName,
          ghanaCardNumber: payload.ghanaCardNumber,
          dateOfBirth,
          occupation: payload.occupation,
          notes: payload.notes || null,
          status: "PENDING_PAYMENT"
        }
      });
      await tx.payment.create({
        data: {
          reference,
          type: "AFA_REGISTRATION",
          amountGhs: feeGhs,
          agentId: req.user.sub,
          afaRegistrationId: registration.id,
          metadata: { email: payload.email }
        }
      });
    });

    return res.json({ success: true, data: paystackData });
  } catch (error) {
    return next(error);
  }
}

async function initializeSubscription(req, res, next) {
  try {
    const payload = validate(initializeSubscriptionSchema, req.body);
    if (!req.user?.sub) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const plan = await prisma.plan.findUnique({ where: { id: payload.planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    const reference = `plan_${plan.id}_${Date.now()}`;
    const paystackData = await initializeTransaction({
      email: payload.email,
      amountGhs: plan.priceGhs,
      reference,
      callbackUrl: `${process.env.BASE_URL || ""}/agent/subscription`,
      metadata: { type: "subscription", planId: plan.id }
    });

    await recordPaymentInit({
      reference,
      type: "SUBSCRIPTION",
      amountGhs: plan.priceGhs,
      agentId: req.user?.sub,
      planId: plan.id,
      metadata: { email: payload.email }
    });

    return res.json({ success: true, data: paystackData });
  } catch (error) {
    return next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.body;
    const data = await verifyTransaction(reference);
    await markPaymentVerified(reference, data.metadata || {});

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  initializeOrderPayment,
  initializeSubscription,
  initializeAfaRegistration,
  verifyPayment
};
