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

const SHANKA_NETWORK_MAP = {
  YELLO: 3,
  TELECEL: 2,
  AT_PREMIUM: 1,
  AT_BIGTIME: 4
};

const STATUS_MAP = {
  accepted: "PLACED",
  queued: "PENDING",
  pending: "PENDING",
  processing: "PROCESSING",
  "in-progress": "PROCESSING",
  delivered: "DELIVERED",
  completed: "COMPLETED",
  success: "SUCCESS",
  successful: "SUCCESS",
  failed: "FAILED",
  error: "FAILED",
  canceled: "CANCELED",
  cancelled: "CANCELED"
};

const normalizeStatus = (value) => {
  if (value === true) return "SUCCESS";
  if (value === false) return "FAILED";
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const numericMap = { 0: "PENDING", 1: "SUCCESS", 2: "FAILED" };
    return numericMap[value] || String(value);
  }
  const key = value.toString().trim().toLowerCase();
  return STATUS_MAP[key] || key.toUpperCase();
};

const resolveNetworkId = (networkKey) => {
  if (!networkKey) return null;
  return SHANKA_NETWORK_MAP[networkKey] || null;
};

const resolveVolumeMb = (capacity) => {
  const num = Number(capacity);
  if (!Number.isFinite(num) || num <= 0) return null;
  const mb = num < 100 ? num * 1000 : num;
  return Math.max(1, Math.round(mb));
};

async function purchaseDataBundle({ networkKey, recipient, capacity, reference }) {
  if (!env.shankaApiKey) {
    const error = new Error("Shanka API key missing");
    error.statusCode = 500;
    throw error;
  }

  const networkId = resolveNetworkId(networkKey);
  if (!networkId) {
    const error = new Error(`Cannot map network key "${networkKey}" to Shanka network`);
    error.statusCode = 400;
    throw error;
  }

  const volumeMb = resolveVolumeMb(capacity);
  if (!volumeMb) {
    const error = new Error("Shanka package invalid");
    error.statusCode = 400;
    throw error;
  }

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": env.shankaApiKey
  };
  if (reference) {
    headers["Idempotency-Key"] = String(reference);
  }

  const response = await fetchWithTimeout(`${env.shankaBaseUrl}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      network_id: networkId,
      msisdn: String(recipient || ""),
      volume_mb: volumeMb
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const msg = payload?.message || payload?.error || "Shanka purchase failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const order = Array.isArray(payload?.orders) ? payload.orders[0] : null;
  const status = normalizeStatus(order?.status || payload?.status) || "PLACED";
  const referenceValue =
    payload?.reference || order?.order_reference || order?.order_code || reference || null;

  return {
    raw: payload,
    reference: referenceValue,
    status
  };
}

async function fetchOrderStatus(reference) {
  if (!env.shankaApiKey) {
    const error = new Error("Shanka API key missing");
    error.statusCode = 500;
    throw error;
  }

  if (!reference) {
    const error = new Error("Shanka reference required");
    error.statusCode = 400;
    throw error;
  }

  const response = await fetchWithTimeout(
    `${env.shankaBaseUrl}/orders/${encodeURIComponent(reference)}`,
    {
      headers: { "x-api-key": env.shankaApiKey }
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const msg = payload?.message || payload?.error || "Shanka status check failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const item = Array.isArray(payload?.items) ? payload.items[0] : null;
  const statusValue = item?.api_status ?? item?.status ?? payload?.status;
  const status = normalizeStatus(statusValue);

  return {
    raw: payload,
    reference: item?.order_reference || payload?.reference || reference,
    status
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeStatus
};
