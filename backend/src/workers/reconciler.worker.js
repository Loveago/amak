const env = require("../config/env");
const logger = require("../config/logger");
const {
  ensureReconcilerActive,
  resolveActivationFloor,
  runReconciliation
} = require("../services/reconciler.service");

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const results = await runReconciliation();
    const reconciled = results.filter((result) => result.reconciled);
    if (reconciled.length > 0 || results.length > 0) {
      const notReconciled = results
        .filter((r) => !r.reconciled)
        .slice(0, 15)
        .map((r) => `${r.orderId}=${r.reason || r.paystackStatus || r.error || "?"}`)
        .join(", ");
      logger.info(
        `Reconciler tick: ${reconciled.length}/${results.length} order(s) reconciled` +
          (notReconciled ? ` (sample not_reconciled: ${notReconciled})` : "")
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
    const floor = resolveActivationFloor(config);
    logger.info(
      `Reconciler cutover is process start ${floor.toISOString()} ` +
        `(orders created before this restart are ignored` +
        `${env.reconcilerActivatedAt ? `; env raise RECONCILER_ACTIVATED_AT=${env.reconcilerActivatedAt}` : ""})`
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
