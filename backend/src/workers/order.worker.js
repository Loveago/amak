const prisma = require("../config/prisma");
const env = require("../config/env");
const logger = require("../config/logger");
const { dispatchOrderToProvider, refreshOrderProviderStatus } = require("../services/order.service");

let running = false;
let lastCleanupAt = 0;

async function tick() {
  if (running) return;
  running = true;

  try {
    const now = Date.now();
    const cleanupIntervalMs = env.orderCleanupIntervalMs || 6 * 60 * 60 * 1000;
    const shouldCleanup = now - lastCleanupAt > cleanupIntervalMs;
    if (shouldCleanup) {
      lastCleanupAt = now;
      const retentionMs = env.orderRetentionMs || 7 * 24 * 60 * 60 * 1000;
      const cutoff = new Date(now - retentionMs);

      try {
        const oldOrders = await prisma.order.findMany({
          where: { createdAt: { lt: cutoff } },
          select: { id: true }
        });
        const oldOrderIds = oldOrders.map((order) => order.id);

        if (oldOrderIds.length) {
          const result = await prisma.$transaction(async (tx) => {
            await tx.payment.deleteMany({ where: { orderId: { in: oldOrderIds } } });
            await tx.orderItem.deleteMany({ where: { orderId: { in: oldOrderIds } } });
            return await tx.order.deleteMany({ where: { id: { in: oldOrderIds } } });
          });

          logger.info(`Order cleanup deleted ${result.count} orders older than ${cutoff.toISOString()}`);
        }
      } catch (error) {
        logger.error(`Order cleanup error: ${error.message}`);
      }
    }

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
