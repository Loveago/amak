const env = require("../config/env");
const logger = require("../config/logger");
const { ensureReconcilerActive, runReconciliation } = require("../services/reconciler.service");

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const results = await runReconciliation();
    const reconciled = results.filter((result) => result.reconciled);
    if (reconciled.length > 0 || results.length > 0) {
      logger.info(
        `Reconciler tick: ${reconciled.length}/${results.length} order(s) reconciled` +
          (results.length > 0
            ? ` (not_reconciled: ${results
                .filter((r) => !r.reconciled)
                .map((r) => `${r.orderId}=${r.reason || r.paystackStatus || "?"}`)
                .join(", ")})`
            : "")
      );
    }
  } catch (error) {
    logger.error(`Reconciler worker tick error: ${error.message}`);
  } finally {
    running = false;
  }
}

async function start() {
  if (!env.paystackSecret) {
    logger.warn("Reconciler worker not started (PAYSTACK_SECRET_KEY missing)");
    return;
  }

  try {
    const config = await ensureReconcilerActive();
    logger.info(
      `Reconciler active since ${config.activatedAt.toISOString()} (orders before this are ignored)`
    );
  } catch (error) {
    logger.error(`Reconciler activation failed: ${error.message}`);
    return;
  }

  const intervalMs = env.reconcilerIntervalMs || 60000;
  logger.info(`Reconciler worker started (interval: ${intervalMs}ms)`);
  setInterval(tick, intervalMs);
  tick();
}

module.exports = { start, tick };
