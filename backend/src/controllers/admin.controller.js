const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const {
  categorySchema,
  productSchema,
  planSchema,
  walletAdjustmentSchema,
  withdrawalUpdateSchema,
  userProfileSchema,
  userPasswordSchema,
  walletSetSchema,
  subscriptionSetSchema,
  afaConfigSchema,
  afaRegistrationStatusSchema
} = require("../validators/admin.validation");
const { validate } = require("../utils/validation");
const slugify = require("../utils/slug");
const { COMMISSION_RATES } = require("../config/affiliate");
const env = require("../config/env");
const { SUBSCRIPTION_DAYS, GRACE_DAYS } = require("../config/subscription");
const { enforceProductLimit } = require("../services/subscription.service");
const { refreshOrderProviderStatus } = require("../services/order.service");

async function dashboard(req, res, next) {
  try {
    const [orders, agents, subscriptions, revenueAgg, payoutsAgg, afaRegistrations] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: "AGENT", status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "GRACE"] } } }),
      prisma.order.aggregate({
        _sum: { totalAmountGhs: true },
        where: { status: { in: ["PAID", "FULFILLED"] } }
      }),
      prisma.withdrawal.aggregate({
        _sum: { amountGhs: true },
        where: { status: "PAID" }
      }),
      prisma.afaRegistration.count({
        where: { status: { in: ["SUBMITTED", "PROCESSING"] } }
      })
    ]);
    const revenueTotal = revenueAgg?._sum?.totalAmountGhs || 0;
    const walletPayouts = payoutsAgg?._sum?.amountGhs || 0;

    return res.json({
      success: true,
      data: { orders, agents, subscriptions, revenueTotal, walletPayouts, afaRegistrations }
    });
  } catch (error) {
    return next(error);
  }
}

async function getSettings(req, res, next) {
  try {
    const afaConfig = await prisma.afaConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", registrationFeeGhs: 20 }
    });
    return res.json({
      success: true,
      data: {
        commissionRates: COMMISSION_RATES,
        paystackConfigured: Boolean(env.paystackPublic),
        baseUrl: env.baseUrl,
        afaRegistrationFeeGhs: afaConfig.registrationFeeGhs
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAfaConfig(req, res, next) {
  try {
    const payload = validate(afaConfigSchema, req.body);
    const config = await prisma.afaConfig.upsert({
      where: { id: "default" },
      update: { registrationFeeGhs: payload.registrationFeeGhs },
      create: { id: "default", registrationFeeGhs: payload.registrationFeeGhs }
    });
    await prisma.auditLog.create({
      data: {
        actorId: req.user.sub,
        action: "ADMIN_UPDATE_AFA_CONFIG",
        meta: { registrationFeeGhs: payload.registrationFeeGhs }
      }
    });
    return res.json({ success: true, data: config });
  } catch (error) {
    return next(error);
  }
}

async function listPayments(req, res, next) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { order: true, plan: true, agent: true, afaRegistration: true }
    });
    return res.json({ success: true, data: payments });
  } catch (error) {
    return next(error);
  }
}

async function listAfaRegistrations(req, res, next) {
  try {
    const registrations = await prisma.afaRegistration.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: true, payments: true }
    });
    return res.json({ success: true, data: registrations });
  } catch (error) {
    return next(error);
  }
}

async function updateAfaRegistrationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const payload = validate(afaRegistrationStatusSchema, req.body);
    const registration = await prisma.afaRegistration.findUnique({ where: { id } });
    if (!registration) {
      return res.status(404).json({ success: false, error: "Registration not found" });
    }

    const updated = await prisma.$transaction([
      prisma.afaRegistration.update({
        where: { id },
        data: { status: payload.status }
      }),
      prisma.auditLog.create({
        data: {
          actorId: req.user.sub,
          action: "ADMIN_UPDATE_AFA_REGISTRATION",
          meta: { afaRegistrationId: id, status: payload.status }
        }
      })
    ]);

    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    return next(error);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { actor: true }
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    return next(error);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const payload = validate(categorySchema, req.body);
    const slug = payload.slug || slugify(payload.name);
    const category = await prisma.category.create({ data: { name: payload.name, slug } });
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const payload = validate(categorySchema, req.body);
    const { id } = req.params;
    const slug = payload.slug || slugify(payload.name);
    const category = await prisma.category.update({
      where: { id },
      data: { name: payload.name, slug }
    });
    return res.json({ success: true, data: category });
  } catch (error) {
    return next(error);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    return res.json({ success: true, data: products });
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const payload = validate(productSchema, req.body);
    const product = await prisma.product.create({ data: payload });
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const payload = validate(productSchema, req.body);
    const { id } = req.params;
    const product = await prisma.product.update({ where: { id }, data: payload });
    return res.json({ success: true, data: product });
  } catch (error) {
    return next(error);
  }
}

async function listPlans(req, res, next) {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { priceGhs: "asc" } });
    return res.json({ success: true, data: plans });
  } catch (error) {
    return next(error);
  }
}

async function createPlan(req, res, next) {
  try {
    const payload = validate(planSchema, req.body);
    const plan = await prisma.plan.create({ data: payload });
    return res.status(201).json({ success: true, data: plan });
  } catch (error) {
    return next(error);
  }
}

async function updatePlan(req, res, next) {
  try {
    const payload = validate(planSchema, req.body);
    const { id } = req.params;
    const plan = await prisma.plan.update({ where: { id }, data: payload });
    return res.json({ success: true, data: plan });
  } catch (error) {
    return next(error);
  }
}

async function listAgents(req, res, next) {
  try {
    const agents = await prisma.user.findMany({
      where: { role: "AGENT" },
      include: {
        wallet: true,
        subscriptions: {
          orderBy: { expiresAt: "desc" },
          take: 1,
          include: { plan: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, data: agents });
  } catch (error) {
    return next(error);
  }
}

async function updateAgentProfile(req, res, next) {
  try {
    const { id } = req.params;
    const payload = validate(userProfileSchema, req.body);
    const agent = await prisma.user.findFirst({ where: { id, role: "AGENT" } });
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    if (payload.email) {
      const existing = await prisma.user.findFirst({
        where: { email: payload.email, id: { not: id } }
      });
      if (existing) {
        return res.status(409).json({ success: false, error: "Email already in use" });
      }
    }

    if (payload.slug) {
      const existing = await prisma.user.findFirst({
        where: { slug: payload.slug, id: { not: id } }
      });
      if (existing) {
        return res.status(409).json({ success: false, error: "Slug already in use" });
      }
    }

    const updated = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: payload }),
      prisma.auditLog.create({
        data: {
          actorId: req.user.sub,
          action: "ADMIN_UPDATE_AGENT_PROFILE",
          meta: { agentId: id, fields: Object.keys(payload) }
        }
      })
    ]);

    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    return next(error);
  }
}

async function updateAgentPassword(req, res, next) {
  try {
    const { id } = req.params;
    const payload = validate(userPasswordSchema, req.body);
    const agent = await prisma.user.findFirst({ where: { id, role: "AGENT" } });
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const updated = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { passwordHash } }),
      prisma.auditLog.create({
        data: {
          actorId: req.user.sub,
          action: "ADMIN_RESET_AGENT_PASSWORD",
          meta: { agentId: id }
        }
      })
    ]);

    return res.json({ success: true, data: { id: updated[0].id } });
  } catch (error) {
    return next(error);
  }
}

async function updateAgentWallet(req, res, next) {
  try {
    const { id } = req.params;
    const payload = validate(walletSetSchema, req.body);
    const agent = await prisma.user.findFirst({ where: { id, role: "AGENT" } });
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const wallet = await prisma.wallet.upsert({
      where: { agentId: id },
      update: {},
      create: { agentId: id }
    });
    const newBalance = payload.balanceGhs;
    const delta = newBalance - Number(wallet.balanceGhs || 0);
    const reason = payload.reason || "ADMIN_SET_BALANCE";

    const updateData = { balanceGhs: newBalance };
    if (delta !== 0) {
      updateData.transactions = {
        create: {
          type: "ADJUSTMENT",
          amountGhs: delta,
          reference: reason
        }
      };
    }

    const [updated] = await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: updateData }),
      prisma.auditLog.create({
        data: {
          actorId: req.user.sub,
          action: "ADMIN_SET_WALLET",
          meta: { agentId: id, balanceGhs: newBalance, deltaGhs: delta, reason }
        }
      })
    ]);

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
}

async function updateAgentSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const payload = validate(subscriptionSetSchema, req.body);
    const agent = await prisma.user.findFirst({ where: { id, role: "AGENT" } });
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const plan = await prisma.plan.findUnique({ where: { id: payload.planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);
    const graceEndsAt = new Date(expiresAt);
    graceEndsAt.setDate(graceEndsAt.getDate() + GRACE_DAYS);

    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { agentId: id, status: { in: ["ACTIVE", "GRACE"] } },
        data: { status: "CANCELED" }
      });
      const created = await tx.subscription.create({
        data: {
          agentId: id,
          planId: payload.planId,
          status: "ACTIVE",
          startsAt,
          expiresAt,
          graceEndsAt
        },
        include: { plan: true }
      });
      await tx.auditLog.create({
        data: {
          actorId: req.user.sub,
          action: "ADMIN_SET_SUBSCRIPTION",
          meta: { agentId: id, planId: payload.planId }
        }
      });
      return created;
    });

    await enforceProductLimit(id);

    return res.json({ success: true, data: subscription });
  } catch (error) {
    return next(error);
  }
}

async function listWallets(req, res, next) {
  try {
    const wallets = await prisma.wallet.findMany({
      include: { agent: true },
      orderBy: { balanceGhs: "desc" }
    });
    return res.json({ success: true, data: wallets });
  } catch (error) {
    return next(error);
  }
}

async function listAffiliates(req, res, next) {
  try {
    const referrals = await prisma.referral.findMany({
      include: { parent: true, child: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, data: referrals });
  } catch (error) {
    return next(error);
  }
}

async function updateAgentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const agent = await prisma.user.update({ where: { id }, data: { status } });
    return res.json({ success: true, data: agent });
  } catch (error) {
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } }, agent: true },
      orderBy: { createdAt: "desc" }
    });
    const refreshed = await Promise.all(orders.map((order) => refreshOrderProviderStatus(order)));
    return res.json({ success: true, data: refreshed });
  } catch (error) {
    return next(error);
  }
}

async function fulfillOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await prisma.order.update({
      where: { id },
      data: { status: "FULFILLED" }
    });
    return res.json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
}

async function listSubscriptions(req, res, next) {
  try {
    const subscriptions = await prisma.subscription.findMany({ include: { agent: true, plan: true } });
    return res.json({ success: true, data: subscriptions });
  } catch (error) {
    return next(error);
  }
}

async function listWithdrawals(req, res, next) {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { agent: true },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, data: withdrawals });
  } catch (error) {
    return next(error);
  }
}

async function updateWithdrawal(req, res, next) {
  try {
    const payload = validate(withdrawalUpdateSchema, req.body);
    const { id } = req.params;
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: "Withdrawal not found" });
    }

    if (withdrawal.status === payload.status) {
      return res.json({ success: true, data: withdrawal });
    }

    const updates = [
      prisma.withdrawal.update({ where: { id }, data: payload }),
      prisma.auditLog.create({
        data: {
          actorId: req.user.sub,
          action: "WITHDRAWAL_STATUS",
          meta: { withdrawalId: id, status: payload.status }
        }
      })
    ];

    if (payload.status === "REJECTED") {
      updates.push(
        prisma.wallet.update({
          where: { agentId: withdrawal.agentId },
          data: {
            balanceGhs: { increment: withdrawal.amountGhs },
            transactions: {
              create: {
                type: "REVERSAL",
                amountGhs: withdrawal.amountGhs,
                reference: `WITHDRAWAL_${withdrawal.id}`
              }
            }
          }
        })
      );
    }

    const [updated] = await prisma.$transaction(updates);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
}

async function adjustWallet(req, res, next) {
  try {
    const payload = validate(walletAdjustmentSchema, req.body);
    const wallet = await prisma.wallet.upsert({
      where: { agentId: payload.agentId },
      update: {},
      create: { agentId: payload.agentId }
    });

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceGhs: { increment: payload.amountGhs },
        transactions: {
          create: {
            type: "ADJUSTMENT",
            amountGhs: payload.amountGhs,
            reference: payload.reason
          }
        }
      },
      include: { transactions: true }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  dashboard,
  getSettings,
  updateAfaConfig,
  listCategories,
  createCategory,
  updateCategory,
  listProducts,
  createProduct,
  updateProduct,
  listPlans,
  createPlan,
  updatePlan,
  listAgents,
  listWallets,
  listAffiliates,
  updateAgentStatus,
  updateAgentProfile,
  updateAgentPassword,
  updateAgentWallet,
  updateAgentSubscription,
  listOrders,
  fulfillOrder,
  listSubscriptions,
  listWithdrawals,
  updateWithdrawal,
  adjustWallet,
  listPayments,
  listAuditLogs,
  listAfaRegistrations,
  updateAfaRegistrationStatus
};
