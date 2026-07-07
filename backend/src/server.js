const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const orderWorker = require("./workers/order.worker");
const shankaStatusWorker = require("./workers/shanka-status.worker");
const elitnutStatusWorker = require("./workers/elitnut-status.worker");

app.listen(env.port, () => {
  logger.info(`API running on port ${env.port}`);
  orderWorker.start();
  shankaStatusWorker.start();
  elitnutStatusWorker.start();
});
