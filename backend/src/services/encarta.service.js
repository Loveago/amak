const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const STATUS_MAP = {
  success: "SUCCESS",
  placed: "PLACED",
  submitted: "SUBMITTED",
  processing: "PROCESSING",
  delivered: "DELIVERED",
  completed: "COMPLETED",
  failed: "FAILED",
  canceled: "CANCELED",
  pending: "PENDING"
};

const normalizeStatus = (value) => {
  if (!value) return "";
  const key = value.toString().trim().toLowerCase();
  return STATUS_MAP[key] || key.toUpperCase();
};

const buildStatusUrl = (reference) => {
  const base = env.encartaStatusUrl || `${env.encartaBaseUrl}/orders?reference=`;
  if (base.includes("{reference}")) {
    return base.replace("{reference}", encodeURIComponent(reference));
  }
  if (base.includes("?")) {
    return `${base}${encodeURIComponent(reference)}`;
  }
  return `${base}/${encodeURIComponent(reference)}`;
};

const isSuccessPayload = (payload) =>
  payload?.status === "success" || payload?.success === true || payload?.status === true;

async function purchaseDataBundle({ networkKey, recipient, capacity }) {
  if (!env.encartaApiKey) {
    const error = new Error("Encarta API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(`${env.encartaBaseUrl}/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.encartaApiKey
    },
    body: JSON.stringify({ networkKey, recipient, capacity })
  });

  const payload = await response.json().catch(() => null);
  if (!isSuccessPayload(payload)) {
    const error = new Error(payload?.message || payload?.error || "Encarta purchase failed");
    error.statusCode = 502;
    throw error;
  }

  const data = payload?.data || payload;
  return {
    raw: data,
    reference: data?.reference || data?.referenceId || data?.id,
    status: normalizeStatus(data?.status || payload?.status)
  };
}

async function fetchOrderStatus(reference) {
  if (!env.encartaApiKey) {
    const error = new Error("Encarta API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(buildStatusUrl(reference), {
    headers: {
      "X-API-Key": env.encartaApiKey
    }
  });

  const payload = await response.json().catch(() => null);
  if (!isSuccessPayload(payload)) {
    const error = new Error(payload?.message || payload?.error || "Encarta status check failed");
    error.statusCode = 502;
    throw error;
  }

  const data = payload?.data || payload;
  return {
    raw: data,
    status: normalizeStatus(data?.status || payload?.status)
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeStatus
};
