const crypto = require("crypto");
const prisma = require("../config/prisma");
const {
  activateProductSchema,
  affiliatePricingSchema,
  agentProfileSchema,
  withdrawalSchema,
  directOrderSchema
} = require("../validators/agent.validation");
const { validate } = require("../utils/validation");
const { ensureActiveSubscription, enforceProductLimit, getCurrentSubscription } = require("../services/subscription.service");
const { refreshOrderProviderStatus, dispatchOrderToProvider } = require("../services/order.service");
const { getAncestorAffiliateMarkupMap, getEffectiveBasePrice } = require("../services/pricing.service");
const { hashKey } = require("../middleware/api-key");

async function dashboard(req, res, next) {
  try {
    const agentId = req.user.sub;
    const [ordersCount, wallet] = await Promise.all([
      prisma.order.count({ where: { agentId } }),
      prisma.wallet.findUnique({ where: { agentId } })
    ]);

    return res.json({
      success: true,
      data: {
        ordersCount,
        walletBalanceGhs: wallet ? wallet.balanceGhs : 0
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const agentId = req.user.sub;
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, email: true, phone: true, slug: true, whatsappLink: true }
    });
    return res.json({ success: true, data: agent });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const agentId = req.user.sub;
    const payload = validate(agentProfileSchema, req.body);
    let whatsappLink = payload.whatsappLink;

    if (whatsappLink !== undefined) {
      const trimmed = whatsappLink.trim();
      if (!trimmed) {
        whatsappLink = null;
      } else {
        const digits = trimmed.replace(/[^\d+]/g, "");
        if (/^\+?\d{8,15}$/.test(digits)) {
          whatsappLink = `https://wa.me/${digits.replace(/\+/g, "")}`;
        } else if (!/^https?:\/\//i.test(trimmed)) {
          whatsappLink = `https://${trimmed}`;
        } else {
          whatsappLink = trimmed;
        }
      }
    }

    const agent = await prisma.user.update({
      where: { id: agentId },
      data: whatsappLink !== undefined ? { whatsappLink } : {}
    });
    return res.json({ success: true, data: agent });
  } catch (error) {
    return next(error);
  }
}

async function listAffiliatePricing(req, res, next) {
  try {
    const agentId = req.user.sub;
    const products = await prisma.product.findMany({
      include: { category: true, agentProducts: { where: { agentId } } }
    });

    const productIds = products.map((product) => product.id);
    const ancestorMarkupMap = await getAncestorAffiliateMarkupMap(agentId, productIds);

    const data = products.map((product) => {
      const agentProduct = product.agentProducts[0];
      const parentBasePriceGhs = getEffectiveBasePrice({
        basePriceGhs: product.basePriceGhs,
        affiliateMarkupMap: ancestorMarkupMap,
        productId: product.id
      });
      const affiliateMarkupGhs = agentProduct ? agentProduct.affiliateMarkupGhs : 0;
      const affiliateBasePriceGhs = parentBasePriceGhs !== null
        ? Number(parentBasePriceGhs) + Number(affiliateMarkupGhs)
        : null;

      return {
        id: product.id,
        name: product.name,
        size: product.size,
        category: product.category,
        basePriceGhs: product.basePriceGhs,
        parentBasePriceGhs,
        affiliateMarkupGhs,
        affiliateBasePriceGhs
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function updateAffiliatePricing(req, res, next) {
  try {
    const agentId = req.user.sub;
    const { productId } = req.params;
    const payload = validate(affiliatePricingSchema, req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const agentProduct = await prisma.agentProduct.upsert({
      where: { agentId_productId: { agentId, productId } },
      update: { affiliateMarkupGhs: payload.affiliateMarkupGhs },
      create: {
        agentId,
        productId,
        affiliateMarkupGhs: payload.affiliateMarkupGhs,
        markupGhs: 0,
        isActive: false
      }
    });

    return res.json({ success: true, data: agentProduct });
  } catch (error) {
    return next(error);
  }
}

async function listProducts(req, res, next) {
  try {
    const agentId = req.user.sub;
    const products = await prisma.product.findMany({
      include: { category: true, agentProducts: { where: { agentId } } }
    });

    const productIds = products.map((product) => product.id);
    const ancestorMarkupMap = await getAncestorAffiliateMarkupMap(agentId, productIds);

    const data = products.map((product) => {
      const agentProduct = product.agentProducts[0];
      const markupGhs = agentProduct ? agentProduct.markupGhs : 0;
      const affiliateMarkupGhs = agentProduct ? agentProduct.affiliateMarkupGhs : 0;
      const parentBasePriceGhs = getEffectiveBasePrice({
        basePriceGhs: product.basePriceGhs,
        affiliateMarkupMap: ancestorMarkupMap,
        productId: product.id
      });
      const sellPriceGhs = parentBasePriceGhs !== null
        ? Number(parentBasePriceGhs) + Number(markupGhs)
        : null;

      return {
        id: product.id,
        name: product.name,
        size: product.size,
        basePriceGhs: parentBasePriceGhs,
        category: product.category,
        isActive: agentProduct ? agentProduct.isActive : false,
        markupGhs,
        affiliateMarkupGhs,
        sellPriceGhs
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function updateAgentProduct(req, res, next) {
  try {
    const agentId = req.user.sub;
    const { productId } = req.params;
    const payload = validate(activateProductSchema, req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    const existing = await prisma.agentProduct.findUnique({
      where: { agentId_productId: { agentId, productId } }
    });

    if (payload.isActive === false) {
      const agentProduct = await prisma.agentProduct.upsert({
        where: { agentId_productId: { agentId, productId } },
        update: {
          ...(payload.markupGhs !== undefined ? { markupGhs: payload.markupGhs } : {}),
          isActive: false
        },
        create: {
          agentId,
          productId,
          markupGhs: payload.markupGhs ?? existing?.markupGhs ?? 0,
          isActive: false
        }
      });

      return res.json({ success: true, data: agentProduct });
    }

    await ensureActiveSubscription(agentId);
    const markupGhs = payload.markupGhs ?? existing?.markupGhs ?? 0;
    const agentProduct = await prisma.agentProduct.upsert({
      where: {
        agentId_productId: { agentId, productId }
      },
      update: {
        markupGhs,
        isActive: true
      },
      create: {
        agentId,
        productId,
        markupGhs,
        isActive: true
      }
    });

    await enforceProductLimit(agentId);

    return res.json({ success: true, data: agentProduct });
  } catch (error) {
    return next(error);
  }
}

async function wallet(req, res, next) {
  try {
    const agentId = req.user.sub;
    const walletData = await prisma.wallet.findUnique({
      where: { agentId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } }
    });

    return res.json({ success: true, data: walletData });
  } catch (error) {
    return next(error);
  }
}

async function createWithdrawal(req, res, next) {
  try {
    const agentId = req.user.sub;
    const payload = validate(withdrawalSchema, req.body);

    const fee = +(payload.amountGhs * 0.02).toFixed(2);
    const totalDebit = +payload.amountGhs.toFixed(2);

    const walletData = await prisma.wallet.findUnique({ where: { agentId } });
    if (!walletData || walletData.balanceGhs < totalDebit) {
      return res.status(400).json({ success: false, error: "Insufficient balance" });
    }

    const [withdrawal] = await prisma.$transaction([
      prisma.withdrawal.create({
        data: {
          agentId,
          amountGhs: payload.amountGhs,
          feeGhs: fee,
          momoNetwork: payload.momoNetwork,
          momoNumber: payload.momoNumber
        }
      }),
      prisma.wallet.update({
        where: { agentId },
        data: {
          balanceGhs: { decrement: totalDebit },
          transactions: {
            create: {
              type: "WITHDRAWAL",
              amountGhs: -Math.abs(totalDebit),
              reference: "WITHDRAWAL_REQUEST",
              metadata: {
                withdrawalAmountGhs: payload.amountGhs,
                feeGhs: fee
              }
            }
          }
        }
      })
    ]);

    return res.status(201).json({ success: true, data: { ...withdrawal, feeGhs: fee } });
  } catch (error) {
    return next(error);
  }
}

async function listWithdrawals(req, res, next) {
  try {
    const agentId = req.user.sub;
    const withdrawals = await prisma.withdrawal.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, data: withdrawals });
  } catch (error) {
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const agentId = req.user.sub;
    const orders = await prisma.order.findMany({
      where: { agentId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
    const refreshed = await Promise.all(orders.map((order) => refreshOrderProviderStatus(order)));
    return res.json({ success: true, data: refreshed });
  } catch (error) {
    return next(error);
  }
}

async function affiliate(req, res, next) {
  try {
    const agentId = req.user.sub;
    const downlines = await prisma.referral.findMany({
      where: { parentId: agentId },
      include: { child: true },
      orderBy: { level: "asc" }
    });

    return res.json({ success: true, data: downlines });
  } catch (error) {
    return next(error);
  }
}

async function subscription(req, res, next) {
  try {
    const agentId = req.user.sub;
    const current = await getCurrentSubscription(agentId);
    return res.json({ success: true, data: current });
  } catch (error) {
    return next(error);
  }
}

async function listPlans(req, res, next) {
  try {
    const plans = await prisma.plan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { priceGhs: "asc" }
    });
    return res.json({ success: true, data: plans });
  } catch (error) {
    return next(error);
  }
}

async function getAfaConfig(req, res, next) {
  try {
    const config = await prisma.afaConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", registrationFeeGhs: 20 }
    });
    return res.json({ success: true, data: config });
  } catch (error) {
    return next(error);
  }
}

async function listAfaRegistrations(req, res, next) {
  try {
    const agentId = req.user.sub;
    const registrations = await prisma.afaRegistration.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      include: { payments: true }
    });
    return res.json({ success: true, data: registrations });
  } catch (error) {
    return next(error);
  }
}

async function generateApiKey(req, res, next) {
  try {
    const agentId = req.user.sub;

    const access = await prisma.apiAccessRequest.findUnique({ where: { agentId } });
    if (!access || access.status !== "APPROVED") {
      return res.status(403).json({ success: false, error: "API access not approved" });
    }

    const existing = await prisma.agentApiKey.findUnique({ where: { agentId } });
    if (existing) {
      return res.status(400).json({ success: false, error: "You already have an active API key. Revoke it first to generate a new one." });
    }

    const rawKey = `amba_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = hashKey(rawKey);
    const lastFour = rawKey.slice(-4);

    await prisma.agentApiKey.create({
      data: { agentId, keyHash, lastFour }
    });

    return res.status(201).json({ success: true, data: { apiKey: rawKey, lastFour } });
  } catch (error) {
    return next(error);
  }
}

async function getApiKey(req, res, next) {
  try {
    const agentId = req.user.sub;
    const record = await prisma.agentApiKey.findUnique({ where: { agentId } });
    if (!record) {
      return res.json({ success: true, data: null });
    }
    return res.json({ success: true, data: { id: record.id, lastFour: record.lastFour, createdAt: record.createdAt } });
  } catch (error) {
    return next(error);
  }
}

async function revokeApiKey(req, res, next) {
  try {
    const agentId = req.user.sub;
    const record = await prisma.agentApiKey.findUnique({ where: { agentId } });
    if (!record) {
      return res.status(404).json({ success: false, error: "No API key found" });
    }
    await prisma.agentApiKey.delete({ where: { id: record.id } });
    return res.json({ success: true, data: { revoked: true } });
  } catch (error) {
    return next(error);
  }
}

async function rotateApiKey(req, res, next) {
  try {
    const agentId = req.user.sub;

    const access = await prisma.apiAccessRequest.findUnique({ where: { agentId } });
    if (!access || access.status !== "APPROVED") {
      return res.status(403).json({ success: false, error: "API access not approved" });
    }

    const rawKey = `amba_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = hashKey(rawKey);
    const lastFour = rawKey.slice(-4);

    await prisma.$transaction(async (tx) => {
      await tx.agentApiKey.deleteMany({ where: { agentId } });
      await tx.agentApiKey.create({
        data: { agentId, keyHash, lastFour }
      });
    });

    return res.status(201).json({ success: true, data: { apiKey: rawKey, lastFour } });
  } catch (error) {
    return next(error);
  }
}

async function requestApiAccess(req, res, next) {
  try {
    const agentId = req.user.sub;
    const existing = await prisma.apiAccessRequest.findUnique({ where: { agentId } });
    if (existing) {
      return res.json({ success: true, data: existing });
    }
    const request = await prisma.apiAccessRequest.create({ data: { agentId } });
    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    return next(error);
  }
}

async function getApiAccessStatus(req, res, next) {
  try {
    const agentId = req.user.sub;
    const request = await prisma.apiAccessRequest.findUnique({ where: { agentId } });
    return res.json({ success: true, data: request || null });
  } catch (error) {
    return next(error);
  }
}

async function createDirectOrder(req, res, next) {
  try {
    const agentId = req.user.sub;
    const payload = validate(directOrderSchema, req.body);

    const product = await prisma.product.findUnique({
      where: { id: payload.productId },
      include: { category: true }
    });
    if (!product || product.status !== "ACTIVE") {
      return res.status(404).json({ success: false, error: "Product not found or inactive" });
    }

    const productIds = [product.id];
    const ancestorMarkupMap = await getAncestorAffiliateMarkupMap(agentId, productIds);
    const effectiveBase = getEffectiveBasePrice({
      basePriceGhs: product.basePriceGhs,
      affiliateMarkupMap: ancestorMarkupMap,
      productId: product.id
    });
    if (effectiveBase === null) {
      return res.status(400).json({ success: false, error: "Product pricing not available" });
    }

    const quantity = payload.quantity || 1;
    const unitPrice = Number(effectiveBase);
    const totalAmount = unitPrice * quantity;

    const walletData = await prisma.wallet.findUnique({ where: { agentId } });
    if (!walletData || walletData.balanceGhs < totalAmount) {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          agentId,
          customerName: payload.customerName || "Direct Order",
          customerPhone: payload.recipientPhone,
          totalAmountGhs: totalAmount,
          status: "PAID",
          items: {
            create: {
              productId: product.id,
              basePriceGhs: unitPrice,
              markupGhs: 0,
              quantity,
              unitPriceGhs: unitPrice,
              totalPriceGhs: totalAmount
            }
          }
        },
        include: { items: { include: { product: true } } }
      });

      await tx.wallet.update({
        where: { agentId },
        data: {
          balanceGhs: { decrement: totalAmount },
          transactions: {
            create: {
              type: "ORDER_DEBIT",
              amountGhs: -Math.abs(totalAmount),
              reference: newOrder.id,
              metadata: { orderId: newOrder.id, productId: product.id }
            }
          }
        }
      });

      return newOrder;
    });

    dispatchOrderToProvider(order.id).catch(() => {});

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  dashboard,
  getProfile,
  updateProfile,
  listAffiliatePricing,
  updateAffiliatePricing,
  listProducts,
  updateAgentProduct,
  wallet,
  createWithdrawal,
  listWithdrawals,
  listOrders,
  affiliate,
  subscription,
  listPlans,
  getAfaConfig,
  listAfaRegistrations,
  generateApiKey,
  getApiKey,
  revokeApiKey,
  rotateApiKey,
  requestApiAccess,
  getApiAccessStatus,
  createDirectOrder
};
