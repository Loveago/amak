const prisma = require("../config/prisma");

function evaluateSubscriptionStatus(subscription) {
  if (!subscription) {
    return null;
  }
  if (subscription.status === "CANCELED") {
    return "CANCELED";
  }
  return "ACTIVE";
}

async function syncSubscriptionStatus(subscription) {
  if (!subscription) {
    return null;
  }
  const status = evaluateSubscriptionStatus(subscription);
  if (status && subscription.status !== status) {
    return prisma.subscription.update({
      where: { id: subscription.id },
      data: { status }
    });
  }
  return subscription;
}

async function startTrialSubscription(agentId) {
  const plan = await prisma.plan.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { priceGhs: "asc" }
  });

  if (!plan) {
    return null;
  }

  await prisma.subscription.updateMany({
    where: { agentId, status: { not: "CANCELED" } },
    data: { status: "CANCELED" }
  });

  const startsAt = new Date();

  const subscription = await prisma.subscription.create({
    data: {
      agentId,
      planId: plan.id,
      status: "ACTIVE",
      startsAt,
      expiresAt: null,
      graceEndsAt: null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: agentId,
      action: "SUBSCRIPTION_TRIAL_STARTED",
      meta: { planId: plan.id, type: "trial" }
    }
  });

  await enforceProductLimit(agentId);

  return subscription;
}

async function getCurrentSubscription(agentId) {
  const subscription = await prisma.subscription.findFirst({
    where: { agentId, status: { not: "CANCELED" } },
    orderBy: { createdAt: "desc" },
    include: { plan: true }
  });

  return syncSubscriptionStatus(subscription);
}

async function enforceProductLimit(agentId) {
  const subscription = await getCurrentSubscription(agentId);
  if (!subscription || subscription.status === "CANCELED") {
    await prisma.agentProduct.updateMany({
      where: { agentId, isActive: true },
      data: { isActive: false }
    });
    return { subscription: null, activeCount: 0 };
  }

  const activeProducts = await prisma.agentProduct.findMany({
    where: { agentId, isActive: true },
    orderBy: { createdAt: "desc" }
  });

  if (activeProducts.length > subscription.plan.productLimit) {
    const excess = activeProducts.slice(subscription.plan.productLimit);
    await prisma.agentProduct.updateMany({
      where: { id: { in: excess.map((item) => item.id) } },
      data: { isActive: false }
    });
  }

  return { subscription, activeCount: Math.min(activeProducts.length, subscription.plan.productLimit) };
}

async function activateSubscription(agentId, planId, reference) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    const error = new Error("Plan not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.subscription.updateMany({
    where: { agentId, status: { not: "CANCELED" } },
    data: { status: "CANCELED" }
  });

  const startsAt = new Date();

  const subscription = await prisma.subscription.create({
    data: {
      agentId,
      planId,
      status: "ACTIVE",
      startsAt,
      expiresAt: null,
      graceEndsAt: null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: agentId,
      action: "SUBSCRIPTION_ACTIVATED",
      meta: { reference, planId }
    }
  });

  await enforceProductLimit(agentId);

  return subscription;
}

async function ensureActiveSubscription(agentId) {
  const subscription = await getCurrentSubscription(agentId);
  if (!subscription || subscription.status === "CANCELED") {
    const error = new Error("Active subscription required");
    error.statusCode = 402;
    throw error;
  }
  return subscription;
}

module.exports = {
  evaluateSubscriptionStatus,
  getCurrentSubscription,
  enforceProductLimit,
  activateSubscription,
  ensureActiveSubscription,
  startTrialSubscription
};
