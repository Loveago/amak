const prisma = require("../config/prisma");
const env = require("../config/env");
const logger = require("../config/logger");
const { refreshOrderProviderStatus } = require("../services/order.service");

const PROVIDER = "ELITENUT";
const TERMINAL_STATUSES = ["DELIVERED", "COMPLETED", "SUCCESS", "FAILED", "CANCELED"];
const MAX_AGE_HOURS = 24;

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        providerReference: { not: null },
        providerPayload: { path: ["provider"], equals: PROVIDER },
        createdAt: { gte: cutoff },
        OR: [
          { providerStatus: null },
          { providerStatus: { notIn: TERMINAL_STATUSES } }
        ]
      },
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: "asc" },
      take: 25
    });

    for (const order of orders) {
      try {
        const updated = await refreshOrderProviderStatus(order, { force: true });
        if (updated?.providerStatus && updated.providerStatus !== order.providerStatus) {
          logger.info(
            `EliteNut status worker: order ${order.id} ${order.providerStatus || "UNKNOWN"} -> ${updated.providerStatus}`
          );
        }
      } catch (error) {
        logger.error(`EliteNut status worker error for order ${order.id}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`EliteNut status worker tick error: ${error.message}`);
  } finally {
    running = false;
  }
}

function start() {
  if (!env.elitnutApiKey) {
    logger.warn("EliteNut status worker not started (ELITENUT_API_KEY missing)");
    return;
  }
  const intervalMs = env.elitnutStatusWorkerIntervalMs || 90000;
  logger.info(`EliteNut status worker started (interval: ${intervalMs}ms)`);
  setInterval(tick, intervalMs);
  tick();
}

module.exports = { start, tick };
