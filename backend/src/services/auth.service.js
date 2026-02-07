const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const slugify = require("../utils/slug");
const { startTrialSubscription } = require("./subscription.service");

const ADMIN_REFERRAL_CODE = "amaba11";

async function generateUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function assignAdminBaseProducts(agentId) {
  const products = await prisma.product.findMany({ select: { id: true } });
  if (!products.length) {
    return;
  }
  await prisma.agentProduct.createMany({
    data: products.map((product) => ({
      agentId,
      productId: product.id,
      markupGhs: 0,
      affiliateMarkupGhs: 0,
      isActive: true
    })),
    skipDuplicates: true
  });
}

async function registerAgent({ name, email, password, phone, referralCode }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error("Email already in use");
    error.statusCode = 409;
    throw error;
  }

  const normalizedReferral = referralCode?.trim().toLowerCase();
  if (!normalizedReferral) {
    const error = new Error("Referral code is required");
    error.statusCode = 400;
    throw error;
  }

  let referrer = null;
  if (normalizedReferral === ADMIN_REFERRAL_CODE) {
    referrer = await prisma.user.findFirst({ where: { slug: ADMIN_REFERRAL_CODE, role: "ADMIN" } });
    if (!referrer) {
      referrer = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    }
    if (!referrer) {
      console.error("[register] Admin referral code lookup failed:", normalizedReferral);
      const error = new Error("Invalid referral code");
      error.statusCode = 400;
      throw error;
    }
  } else {
    referrer = await prisma.user.findFirst({ where: { referralCode: normalizedReferral, role: "AGENT" } });
    if (!referrer) {
      referrer = await prisma.user.findFirst({ where: { slug: normalizedReferral, role: "AGENT" } });
    }
    if (!referrer) {
      console.error("[register] Referral code lookup failed:", normalizedReferral);
      const error = new Error("Invalid referral code");
      error.statusCode = 400;
      throw error;
    }
  }

  const slug = await generateUniqueSlug(name);
  const passwordHash = await bcrypt.hash(password, 12);

  const agent = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone,
      slug,
      referralCode: slug,
      role: "AGENT",
      wallet: { create: {} }
    }
  });

  if (normalizedReferral === ADMIN_REFERRAL_CODE) {
    await assignAdminBaseProducts(agent.id);
  }

  if (referrer && referrer.id !== agent.id) {
    await prisma.referral.create({
      data: { parentId: referrer.id, childId: agent.id, level: 1 }
    });

    const parentRefs = await prisma.referral.findMany({
      where: { childId: referrer.id },
      orderBy: { level: "asc" }
    });

    for (const parentRef of parentRefs) {
      const newLevel = parentRef.level + 1;
      if (newLevel <= 3) {
        await prisma.referral.create({
          data: {
            parentId: parentRef.parentId,
            childId: agent.id,
            level: newLevel
          }
        });
      }
    }
  }

  try {
    await startTrialSubscription(agent.id);
  } catch (error) {
    console.error("Failed to start trial subscription", error);
  }

  return agent;
}

async function authenticateUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  return user;
}

async function issuePasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt }
  });

  return token;
}

async function resetPassword(token, password) {
  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    const error = new Error("Reset token invalid or expired");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash }
    })
  ]);
}

module.exports = {
  registerAgent,
  authenticateUser,
  issuePasswordReset,
  resetPassword
};
