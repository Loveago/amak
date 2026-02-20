const prisma = require("../config/prisma");
const { dispatchOrderToProvider, refreshOrderProviderStatus } = require("../services/order.service");

async function listPackages(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", apiPriceGhs: { not: null } },
      include: { category: true },
      orderBy: { name: "asc" }
    });

    const data = products.map((p) => ({
      id: p.id,
      network: p.category?.name || "",
      networkSlug: p.category?.slug || "",
      name: p.name,
      size: p.size,
      price: p.apiPriceGhs
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function getBalance(req, res, next) {
  try {
    const agentId = req.apiAgent.id;
    const wallet = await prisma.wallet.findUnique({ where: { agentId } });
    return res.json({ success: true, balance: wallet ? wallet.balanceGhs : 0 });
  } catch (error) {
    return next(error);
  }
}

async function placeOrder(req, res, next) {
  try {
    const agentId = req.apiAgent.id;
    const { productId, recipientPhone, quantity, reference: clientRef } = req.body;

    if (!productId || !recipientPhone) {
      return res.status(400).json({ success: false, error: "productId and recipientPhone are required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });
    if (!product || product.status !== "ACTIVE" || product.apiPriceGhs === null) {
      return res.status(404).json({ success: false, error: "Product not found or not available via API" });
    }

    const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    const unitPrice = Number(product.apiPriceGhs);
    const totalAmount = unitPrice * qty;

    const wallet = await prisma.wallet.findUnique({ where: { agentId } });
    if (!wallet || wallet.balanceGhs < totalAmount) {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          agentId,
          customerName: clientRef || "API Order",
          customerPhone: recipientPhone,
          totalAmountGhs: totalAmount,
          status: "PAID",
          items: {
            create: {
              productId: product.id,
              basePriceGhs: unitPrice,
              markupGhs: 0,
              quantity: qty,
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
              metadata: { orderId: newOrder.id, source: "API", clientRef }
            }
          }
        }
      });

      return newOrder;
    });

    dispatchOrderToProvider(order.id).catch(() => {});

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        productId: product.id,
        network: product.category?.name || "",
        size: product.size,
        recipientPhone,
        quantity: qty,
        totalAmountGhs: totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrderStatus(req, res, next) {
  try {
    const agentId = req.apiAgent.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { include: { category: true } } } } }
    });

    if (!order || order.agentId !== agentId) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const refreshed = await refreshOrderProviderStatus(order);

    const item = refreshed.items?.[0];
    return res.json({
      success: true,
      data: {
        orderId: refreshed.id,
        productId: item?.productId || null,
        network: item?.product?.category?.name || "",
        size: item?.product?.size || "",
        recipientPhone: refreshed.customerPhone,
        quantity: item?.quantity || 1,
        totalAmountGhs: refreshed.totalAmountGhs,
        status: refreshed.status,
        providerStatus: refreshed.providerStatus || null,
        createdAt: refreshed.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listPackages, getBalance, placeOrder, getOrderStatus };
