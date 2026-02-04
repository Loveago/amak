const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || "",
  paystackPublic: process.env.PAYSTACK_PUBLIC_KEY || "",
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  encartaBaseUrl: process.env.ENCARTA_BASE_URL || "https://encartastores.com/api",
  encartaStatusUrl: process.env.ENCARTA_STATUS_URL || "",
  encartaApiKey: process.env.ENCARTA_API_KEY || "",
  encartaStatusThrottleMs: Number(process.env.ENCARTA_STATUS_THROTTLE_MS || 60000)
};

module.exports = env;
