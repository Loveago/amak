const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");

app.listen(env.port, () => {
  logger.info(`API running on port ${env.port}`);
});
