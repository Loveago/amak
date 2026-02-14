const prisma = require("../config/prisma");
const env = require("../config/env");
const logger = require("../config/logger");
const { dispatchOrderToProvider, refreshOrderProviderStatus } = require("../services/order.service");

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PAID",
        providerReference: null,
        providerStatus: { notIn: ["FAILED"] }
      },
      orderBy: { createdAt: "asc" },
      take: 10
    });

    for (const order of pendingOrders) {
      try {
        await dispatchOrderToProvider(order.id);
      } catch (error) {
        logger.error(`Worker dispatch error for order ${order.id}: ${error.message}`);
      }
    }

    const processingOrders = await prisma.order.findMany({
      where: {
        providerReference: { not: null },
        providerStatus: { notIn: ["DELIVERED", "COMPLETED", "SUCCESS", "FAILED", "CANCELED"] }
      },
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: "asc" },
      take: 20
    });

    for (const order of processingOrders) {
      try {
        await refreshOrderProviderStatus(order);
      } catch (error) {
        logger.error(`Worker status refresh error for order ${order.id}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Order worker tick error: ${error.message}`);
  } finally {
    running = false;
  }
}

function start() {
  const intervalMs = env.orderWorkerIntervalMs || 10000;
  logger.info(`Order worker started (interval: ${intervalMs}ms)`);
  setInterval(tick, intervalMs);
  tick();
}

module.exports = { start, tick };
