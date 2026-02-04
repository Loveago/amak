const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const ACKMORRE_STATUS = {
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
  return ACKMORRE_STATUS[key] || key.toUpperCase();
};

const buildStatusUrl = (reference) => {
  const base = env.ackmorreStatusUrl || `${env.ackmorreBaseUrl}/orders?reference=`;
  if (base.includes("{reference}")) {
    return base.replace("{reference}", encodeURIComponent(reference));
  }
  if (base.includes("?")) {
    return `${base}${encodeURIComponent(reference)}`;
  }
  return `${base}/${encodeURIComponent(reference)}`;
};

async function purchaseDataBundle({ networkKey, recipient, capacity }) {
  if (!env.ackmorreApiKey) {
    const error = new Error("Ackmorre API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(`${env.ackmorreBaseUrl}/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.ackmorreApiKey
    },
    body: JSON.stringify({ networkKey, recipient, capacity })
  });

  const payload = await response.json();
  if (!payload?.status || payload.status !== "success") {
    const error = new Error(payload?.message || "Ackmorre purchase failed");
    error.statusCode = 502;
    throw error;
  }

  return {
    raw: payload.data,
    reference: payload.data?.reference || payload.data?.referenceId,
    status: normalizeStatus(payload.data?.status)
  };
}

async function fetchOrderStatus(reference) {
  if (!env.ackmorreApiKey) {
    const error = new Error("Ackmorre API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(buildStatusUrl(reference), {
    headers: {
      "X-API-Key": env.ackmorreApiKey
    }
  });

  const payload = await response.json();
  if (!payload?.status || payload.status !== "success") {
    const error = new Error(payload?.message || "Ackmorre status check failed");
    error.statusCode = 502;
    throw error;
  }

  return {
    raw: payload.data,
    status: normalizeStatus(payload.data?.status)
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeStatus
};
