const express = require("express");
const rateLimit = require("express-rate-limit");
const authenticate = require("../middleware/auth");
const { register, login, refresh, forgotPassword, resetPasswordHandler, me } = require("../controllers/auth.controller");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordHandler);
router.get("/me", authenticate, me);

module.exports = router;
