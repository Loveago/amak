const prisma = require("../config/prisma");
const env = require("../config/env");
const { creditWallet } = require("./wallet.service");
const { creditAffiliateCommissions } = require("./affiliate.service");
const {
  purchaseDataBundle: purchaseEncartaBundle,
  fetchOrderStatus,
  normalizeStatus
} = require("./encarta.service");
const { purchaseDataBundle: purchaseDatahubBundle } = require("./datahub.service");

const NETWORK_KEY_BY_CATEGORY = {
  mtn: "YELLO",
  telecel: "TELECEL",
  "at-ishare": "AT_PREMIUM",
  "at-bigtime": "AT_BIGTIME"
};

const DATAHUB_NETWORK_BY_CATEGORY = {
  telecel: "telecel",
  vodafone: "telecel",
  "at-ishare": "ishare",
  "at-bigtime": "bigtime"
};

const DELIVERED_STATUSES = new Set(["DELIVERED", "COMPLETED", "SUCCESS"]);

const resolveEncartaNetworkKey = (category) => {
  if (!category) return null;
  const slug = category.slug?.toLowerCase();
  if (slug && NETWORK_KEY_BY_CATEGORY[slug]) {
    return NETWORK_KEY_BY_CATEGORY[slug];
  }
  const name = category.name?.toLowerCase() || "";
  if (name.includes("mtn")) return "YELLO";
  if (name.includes("telecel") || name.includes("vodafone")) return "TELECEL";
  if (name.includes("ishare")) return "AT_PREMIUM";
  if (name.includes("bigtime")) return "AT_BIGTIME";
  return null;
};

const resolveDatahubNetwork = (category) => {
  if (!category) return null;
  const slug = category.slug?.toLowerCase();
  if (slug && DATAHUB_NETWORK_BY_CATEGORY[slug]) {
    return DATAHUB_NETWORK_BY_CATEGORY[slug];
  }
  const name = category.name?.toLowerCase() || "";
  if (name.includes("telecel") || name.includes("vodafone")) return "telecel";
  if (name.includes("ishare")) return "ishare";
  if (name.includes("bigtime")) return "bigtime";
  return null;
};

const resolveProvider = (category) => {
  const name = category?.name?.toLowerCase() || "";
  const slug = category?.slug?.toLowerCase() || "";
  if (slug.includes("mtn") || name.includes("mtn")) return "ENCARTA";
  if (
    slug.includes("telecel") ||
    slug.includes("vodafone") ||
    slug.includes("ishare") ||
    slug.includes("bigtime") ||
    name.includes("telecel") ||
    name.includes("vodafone") ||
    name.includes("ishare") ||
    name.includes("bigtime")
  ) {
    return "DATAHUB";
  }
  return null;
};

const parseCapacity = (size, quantity) => {
  if (!size) return null;
  const numeric = Number.parseFloat(size);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const multiplier = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  return numeric * multiplier;
};

const shouldRefreshStatus = (lastCheckedAt) => {
  if (!lastCheckedAt) return true;
  const last = new Date(lastCheckedAt).getTime();
  if (!Number.isFinite(last)) return true;
  return Date.now() - last > env.encartaStatusThrottleMs;
};

async function dispatchOrderToProvider(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { include: { category: true } } } } }
  });

  if (!order || !order.items?.length) {
    return order;
  }

  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    return order;
  }

  if (order.providerReference) {
    return order;
  }

  const primaryItem = order.items[0];
  const capacity = parseCapacity(primaryItem.product?.size, primaryItem.quantity);
  const category = primaryItem.product?.category;
  const provider = resolveProvider(category) || "ENCARTA";
  const encartaNetworkKey = resolveEncartaNetworkKey(category);
  const datahubNetwork = resolveDatahubNetwork(category);
  const recipient = order.customerPhone || "";

  if (!capacity || !recipient) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        providerStatus: "FAILED",
        providerLastCheckedAt: new Date(),
        providerPayload: {
          error: "Unable to map product to provider payload",
          recipient,
          provider,
          encartaNetworkKey,
          datahubNetwork,
          capacity
        }
      }
    });
    return order;
  }

  if (provider === "DATAHUB" && !env.datahubApiKey) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        providerStatus: "NOT_SUBMITTED",
        providerLastCheckedAt: new Date(),
        providerPayload: { provider: "DATAHUB", error: "DataHub API key missing" }
      }
    });
    return order;
  }

  if (provider === "ENCARTA" && !env.encartaApiKey) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        providerStatus: "NOT_SUBMITTED",
        providerLastCheckedAt: new Date(),
        providerPayload: { provider: "ENCARTA", error: "Encarta API key missing" }
      }
    });
    return order;
  }

  try {
    const result =
      provider === "DATAHUB"
        ? await purchaseDatahubBundle({
            network: datahubNetwork,
            recipient,
            capacity,
            reference: order.id
          })
        : await purchaseEncartaBundle({
            networkKey: encartaNetworkKey,
            recipient,
            capacity
          });

    const status = normalizeStatus(result.status) || "PLACED";
    const updates = {
      providerReference: result.reference,
      providerStatus: status,
      providerPayload: { provider, raw: result.raw },
      providerLastCheckedAt: new Date()
    };

    if (DELIVERED_STATUSES.has(status)) {
      updates.status = "FULFILLED";
    }

    await prisma.order.update({ where: { id: orderId }, data: updates });
  } catch (error) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        providerStatus: "FAILED",
        providerLastCheckedAt: new Date(),
        providerPayload: { error: error.message }
      }
    });
  }

  return order;
}

async function refreshOrderProviderStatus(order) {
  const provider = order?.providerPayload?.provider || "ENCARTA";
  if (provider === "DATAHUB") {
    return order;
  }

  if (!order?.providerReference || !env.encartaApiKey) {
    return order;
  }

  const currentStatus = normalizeStatus(order.providerStatus);
  if (DELIVERED_STATUSES.has(currentStatus)) {
    return order;
  }

  if (!shouldRefreshStatus(order.providerLastCheckedAt)) {
    return order;
  }

  try {
    const result = await fetchOrderStatus(order.providerReference);
    const status = normalizeStatus(result.status);
    const updates = {
      providerStatus: status,
      providerPayload: result.raw,
      providerLastCheckedAt: new Date()
    };
    if (DELIVERED_STATUSES.has(status)) {
      updates.status = "FULFILLED";
    }
    await prisma.order.update({ where: { id: order.id }, data: updates });
    return { ...order, ...updates };
  } catch (error) {
    return order;
  }
}

async function settleOrderPayment(orderId, reference) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { include: { category: true } } } } }
  });

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.status === "PAID" || order.status === "FULFILLED") {
    if (!order.providerReference) {
      await dispatchOrderToProvider(orderId);
    }
    return order;
  }

  const profit = order.items.reduce(
    (sum, item) => sum + Number(item.markupGhs) * item.quantity,
    0
  );

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", paymentRef: reference }
  });

  await creditWallet({
    agentId: order.agentId,
    amountGhs: profit,
    type: "PROFIT",
    reference: orderId,
    metadata: { orderTotalGhs: order.totalAmountGhs }
  });

  await creditAffiliateCommissions({
    agentId: order.agentId,
    orderId,
    orderTotalGhs: order.totalAmountGhs
  });

  await dispatchOrderToProvider(orderId);

  return order;
}

module.exports = {
  settleOrderPayment,
  dispatchOrderToProvider,
  refreshOrderProviderStatus
};
