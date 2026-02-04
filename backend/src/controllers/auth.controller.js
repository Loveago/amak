const prisma = require("../config/prisma");
const { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } = require("../validators/auth.validation");
const { validate } = require("../utils/validation");
const { issueTokens } = require("../utils/tokens");
const { registerAgent, authenticateUser, issuePasswordReset, resetPassword } = require("../services/auth.service");
const env = require("../config/env");
const jwt = require("jsonwebtoken");

async function register(req, res, next) {
  try {
    const payload = validate(registerSchema, req.body);
    const user = await registerAgent(payload);
    const tokens = issueTokens(user);

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, slug: user.slug },
        tokens
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const payload = validate(loginSchema, req.body);
    const user = await authenticateUser(payload.email, payload.password);

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false, error: "Account inactive" });
    }

    const tokens = issueTokens(user);
    return res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, slug: user.slug },
        tokens
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const payload = validate(refreshSchema, req.body);
    const decoded = jwt.verify(payload.refreshToken, env.jwtRefreshSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    const tokens = issueTokens(user);
    return res.json({ success: true, data: { tokens } });
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const payload = validate(forgotPasswordSchema, req.body);
    const token = await issuePasswordReset(payload.email);
    return res.json({
      success: true,
      data: {
        message: "If the email exists, a reset token was issued.",
        token
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPasswordHandler(req, res, next) {
  try {
    const payload = validate(resetPasswordSchema, req.body);
    await resetPassword(payload.token, payload.password);
    return res.json({ success: true, data: { message: "Password updated" } });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        slug: user.slug
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPasswordHandler,
  me
};
