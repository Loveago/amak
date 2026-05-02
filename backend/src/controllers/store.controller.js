const prisma = require("../config/prisma");
const { createOrderSchema } = require("../validators/store.validation");
const { validate } = require("../utils/validation");
const { enforceProductLimit } = require("../services/subscription.service");
const { getAncestorAffiliateMarkupMap, getEffectiveBasePrice } = require("../services/pricing.service");

function buildPhoneCandidates(rawValue) {
  const raw = String(rawValue || "").trim();
  const digits = raw.replace(/\D/g, "");
  const candidates = new Set([raw, digits]);

  if (digits.length === 10 && digits.startsWith("0")) {
    candidates.add(`233${digits.slice(1)}`);
    candidates.add(`+233${digits.slice(1)}`);
    candidates.add(digits.slice(1));
  }
  if (digits.length === 9) {
    candidates.add(`0${digits}`);
    candidates.add(`233${digits}`);
    candidates.add(`+233${digits}`);
  }
  if (digits.length === 12 && digits.startsWith("233")) {
    candidates.add(`0${digits.slice(3)}`);
    candidates.add(`+${digits}`);
    candidates.add(digits.slice(3));
  }
  if (digits.length === 13 && digits.startsWith("233")) {
    candidates.add(`0${digits.slice(4)}`);
    candidates.add(digits.slice(4));
  }

  return candidates;
}

function mapAgentProducts(agentProducts, affiliateMarkupMap) {
  const categories = new Map();

  agentProducts.forEach((item) => {
    if (!item.product || !item.product.category || item.product.basePriceGhs === null) {
      return;
    }

    const parentBasePriceGhs = getEffectiveBasePrice({
      basePriceGhs: item.product.basePriceGhs,
      affiliateMarkupMap,
      productId: item.product.id
    });
    if (parentBasePriceGhs === null) {
      return;
    }

    const categoryId = item.product.category.id;
    if (!categories.has(categoryId)) {
      categories.set(categoryId, {
        id: item.product.category.id,
        name: item.product.category.name,
        slug: item.product.category.slug,
        products: []
      });
    }

    const sellPrice = Number(parentBasePriceGhs) + Number(item.markupGhs || 0);
    categories.get(categoryId).products.push({
      id: item.product.id,
      name: item.product.name,
      size: item.product.size,
      basePriceGhs: parentBasePriceGhs,
      markupGhs: item.markupGhs,
      sellPriceGhs: sellPrice
    });
  });

  return Array.from(categories.values());
}

async function getStorefront(req, res, next) {
  try {
    const { slug } = req.params;
    const agent = await prisma.user.findFirst({
      where: { slug, role: "AGENT", status: "ACTIVE" }
    });

    if (!agent) {
      return res.status(404).json({ success: false, error: "Storefront not found" });
    }

    const { subscription } = await enforceProductLimit(agent.id);
    if (!subscription) {
      return res.status(402).json({ success: false, error: "Subscription inactive" });
    }

    const agentProducts = await prisma.agentProduct.findMany({
      where: { agentId: agent.id, isActive: true },
      include: { product: { include: { category: true } } }
    });

    const productIds = agentProducts.map((item) => item.productId);
    const ancestorMarkupMap = await getAncestorAffiliateMarkupMap(agent.id, productIds);
    const categories = mapAgentProducts(agentProducts, ancestorMarkupMap);

    return res.json({
      success: true,
      data: {
        agent: { id: agent.id, name: agent.name, slug: agent.slug, whatsappLink: agent.whatsappLink },
        categories
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const { slug } = req.params;
    const payload = validate(createOrderSchema, req.body);

    const agent = await prisma.user.findFirst({
      where: { slug, role: "AGENT", status: "ACTIVE" }
    });

    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const { subscription } = await enforceProductLimit(agent.id);
    if (!subscription) {
      return res.status(402).json({ success: false, error: "Subscription inactive" });
    }

    const productIds = payload.items.map((item) => item.productId);
    const agentProducts = await prisma.agentProduct.findMany({
      where: {
        agentId: agent.id,
        productId: { in: productIds },
        isActive: true
      },
      include: { product: true }
    });

    const ancestorMarkupMap = await getAncestorAffiliateMarkupMap(agent.id, productIds);

    const productMap = new Map();
    agentProducts.forEach((entry) => productMap.set(entry.productId, entry));

    const orderItems = payload.items.map((item) => {
      const entry = productMap.get(item.productId);
      if (!entry || entry.product.basePriceGhs === null) {
        const error = new Error("Invalid product selection");
        error.statusCode = 400;
        throw error;
      }

      const parentBasePriceGhs = getEffectiveBasePrice({
        basePriceGhs: entry.product.basePriceGhs,
        affiliateMarkupMap: ancestorMarkupMap,
        productId: entry.productId
      });
      if (parentBasePriceGhs === null) {
        const error = new Error("Invalid product selection");
        error.statusCode = 400;
        throw error;
      }
      const basePrice = Number(parentBasePriceGhs);
      const markup = Number(entry.markupGhs || 0);
      const unitPrice = basePrice + markup;
      const totalPrice = unitPrice * item.quantity;

      return {
        productId: entry.productId,
        basePriceGhs: basePrice,
        markupGhs: markup,
        quantity: item.quantity,
        unitPriceGhs: unitPrice,
        totalPriceGhs: totalPrice
      };
    });

    const totalAmountGhs = orderItems.reduce(
      (sum, item) => sum + item.totalPriceGhs,
      0
    );

    const customerName = payload.customerName?.trim() || "Guest customer";
    const customerPhone = payload.recipientPhone || payload.customerPhone || "0000000000";
    const order = await prisma.order.create({
      data: {
        agentId: agent.id,
        customerName,
        customerPhone,
        totalAmountGhs,
        items: { create: orderItems }
      },
      include: { items: { include: { product: true } } }
    });

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
}

async function getReceipt(req, res, next) {
  try {
    const { slug, orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, agent: true }
    });

    if (!order || order.agent.slug !== slug) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
}

async function getReceiptByOrderId(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, agent: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
}

async function lookupOrdersByPhone(req, res, next) {
  try {
    const { slug } = req.params;
    const phoneRaw = String(req.query.phone || "").trim();
    if (!phoneRaw) {
      return res.status(400).json({ success: false, error: "phone query parameter is required" });
    }

    const digits = phoneRaw.replace(/\D/g, "");
    if (digits.length < 9) {
      return res.status(400).json({ success: false, error: "Enter a valid phone number" });
    }

    const agent = await prisma.user.findFirst({
      where: { slug, role: "AGENT", status: "ACTIVE" },
      select: { id: true, slug: true }
    });
    if (!agent) {
      return res.status(404).json({ success: false, error: "Storefront not found" });
    }

    const inputCandidates = buildPhoneCandidates(phoneRaw);

    const orders = await prisma.order.findMany({
      where: {
        agentId: agent.id
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, size: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 250
    });

    const matched = orders.filter((order) => {
      const orderCandidates = buildPhoneCandidates(order.customerPhone || "");
      for (const candidate of inputCandidates) {
        if (candidate && orderCandidates.has(candidate)) {
          return true;
        }
      }
      return false;
    });

    const data = matched.slice(0, 10).map((order) => ({
      id: order.id,
      customerPhone: order.customerPhone,
      totalAmountGhs: order.totalAmountGhs,
      status: order.status,
      providerStatus: order.providerStatus || null,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product?.name || "Bundle",
        size: item.product?.size || null,
        quantity: item.quantity
      }))
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getStorefront, createOrder, getReceipt, getReceiptByOrderId, lookupOrdersByPhone };
