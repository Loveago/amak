const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

const XPRESS_NETWORK_MAP = {
  YELLO: "mtn",
  TELECEL: "telecel",
  AT_PREMIUM: "at_premium",
  AT_BIGTIME: "at_bigtime",
  MTN_EXPRESS: "mtn_express"
};

const STATUS_MAP = {
  pending: "PENDING",
  processing: "PROCESSING",
  completed: "COMPLETED",
  failed: "FAILED",
  refunded: "REFUNDED",
  success: "SUCCESS",
  delivered: "DELIVERED"
};

const normalizeStatus = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const key = String(value).trim().toLowerCase();
  return STATUS_MAP[key] || key.toUpperCase();
};

const resolveXpressService = (networkKey) => {
  if (!networkKey) return null;
  return XPRESS_NETWORK_MAP[networkKey] || null;
};

/**
 * Purchase a data bundle via Xpress API.
 * Xpress API accepts batch orders (1-1000 items). We send a single item per call.
 * capacity is in GB — Xpress uses data_gb as whole GB.
 */
async function purchaseDataBundle({ networkKey, recipient, capacity, reference }) {
  if (!env.xpressApiKey) {
    const error = new Error("Xpress API key missing");
    error.statusCode = 500;
    throw error;
  }

  const service = resolveXpressService(networkKey);
  if (!service) {
    const error = new Error(`Cannot map network key "${networkKey}" to Xpress service`);
    error.statusCode = 400;
    throw error;
  }

  const dataGb = Math.max(1, Math.round(Number(capacity) || 1));

  const itemRef = reference ? String(reference) : `xpr_${Date.now()}`;

  const response = await fetchWithTimeout(`${env.xpressBaseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.xpressApiKey
    },
    body: JSON.stringify({
      service,
      items: [
        {
          msisdn: String(recipient || ""),
          data_gb: dataGb,
          reference: itemRef
        }
      ]
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = payload?.error || "Xpress purchase failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  // Xpress returns: { order_id, items, charged, balance }
  const orderId = payload?.order_id || null;
  // Check item statuses to determine overall status
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const firstItem = items[0];
  const rawItemStatus = firstItem?.status || payload?.status;
  const status = normalizeStatus(rawItemStatus) || "PLACED";

  return {
    raw: payload,
    reference: orderId || itemRef,
    status
  };
}

/**
 * Fetch order status from Xpress API.
 * reference should be the Xpress order_id.
 */
async function fetchOrderStatus(reference) {
  if (!env.xpressApiKey) {
    const error = new Error("Xpress API key missing");
    error.statusCode = 500;
    throw error;
  }

  if (!reference) {
    const error = new Error("Xpress reference required");
    error.statusCode = 400;
    throw error;
  }

  const response = await fetchWithTimeout(
    `${env.xpressBaseUrl}/orders/${encodeURIComponent(reference)}`,
    {
      headers: { "X-API-Key": env.xpressApiKey }
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = payload?.error || "Xpress status check failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  // Xpress returns order details with items array
  // Overall status is the order-level status; item-level statuses are in items[]
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const firstItem = items[0];
  const status = normalizeStatus(firstItem?.status || payload?.status);

  return {
    raw: payload,
    reference: payload?.id || reference,
    status
  };
}

/**
 * Fetch wallet balance from Xpress API.
 * Returns balance in GHS.
 */
async function fetchBalance() {
  if (!env.xpressApiKey) {
    const error = new Error("Xpress API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetchWithTimeout(`${env.xpressBaseUrl}/wallet`, {
    headers: { "X-API-Key": env.xpressApiKey }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = payload?.error || "Failed to fetch Xpress balance";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  // Xpress returns: { balance_ghs: 481.00, updated_at: "..." }
  // Convert to same format as GrandAPI balance (in smallest unit = pesewas)
  const balanceGhs = Number(payload?.balance_ghs || 0);

  return {
    raw: payload,
    balance: Math.round(balanceGhs * 100), // convert GHS to pesewas
    totalSales: 0,
    totalDeposit: 0,
    overDraft: 0
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeStatus,
  fetchBalance
};
