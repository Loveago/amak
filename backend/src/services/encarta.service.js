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

const STATUS_MAP = {
  success: "SUCCESS",
  successful: "SUCCESS",
  placed: "PLACED",
  submitted: "SUBMITTED",
  processing: "PROCESSING",
  "in-progress": "PROCESSING",
  inprogress: "PROCESSING",
  delivered: "DELIVERED",
  completed: "COMPLETED",
  complete: "COMPLETED",
  fulfilled: "COMPLETED",
  failed: "FAILED",
  failure: "FAILED",
  error: "FAILED",
  canceled: "CANCELED",
  cancelled: "CANCELED",
  pending: "PENDING",
  queued: "PENDING"
};

const normalizeStatus = (value) => {
  if (value === true) return "SUCCESS";
  if (value === false) return "FAILED";
  if (value === null || value === undefined || value === "") return "";
  const key = value.toString().trim().toLowerCase();
  return STATUS_MAP[key] || key.toUpperCase();
};

const buildStatusUrl = (reference) => {
  const base = env.encartaStatusUrl || `${env.encartaBaseUrl}/status/`;
  if (base.includes("{reference}")) {
    return base.replace("{reference}", encodeURIComponent(reference));
  }
  if (base.includes("?")) {
    return `${base}${encodeURIComponent(reference)}`;
  }
  return `${base}${base.endsWith("/") ? "" : "/"}${encodeURIComponent(reference)}`;
};

const isSuccessPayload = (payload) =>
  payload?.status === "success" ||
  payload?.success === true ||
  payload?.status === true ||
  payload?.ok === true;

const extractOrderStatus = (payload) => {
  if (!payload) return "";
  const candidates = [
    payload?.data?.status,
    payload?.order?.status,
    payload?.result?.status,
    payload?.payload?.status,
    payload?.data?.orderStatus,
    payload?.orderStatus,
    payload?.deliveryStatus,
    payload?.data?.deliveryStatus,
    payload?.data?.state,
    payload?.state,
    payload?.status
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      return candidate;
    }
  }
  return "";
};

async function purchaseDataBundle({ networkKey, recipient, capacity }) {
  if (!env.encartaApiKey) {
    const error = new Error("Encarta API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetchWithTimeout(`${env.encartaBaseUrl}/purchase`, {
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
  const rawStatus = extractOrderStatus(payload);
  return {
    raw: data,
    reference:
      data?.reference ||
      data?.referenceId ||
      data?.id ||
      data?.orderId ||
      payload?.reference ||
      payload?.orderId,
    status: normalizeStatus(rawStatus)
  };
}

async function fetchOrderStatus(reference) {
  if (!env.encartaApiKey) {
    const error = new Error("Encarta API key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetchWithTimeout(buildStatusUrl(reference), {
    headers: {
      "X-API-Key": env.encartaApiKey
    }
  });

  const payload = await response.json().catch(() => null);

  // Some Encarta status responses omit the envelope `status: 'success'`
  // flag and return the order object directly. Only treat as error if
  // HTTP failed or payload explicitly signals failure.
  const hasExplicitFailure =
    payload?.status === "failed" ||
    payload?.status === "error" ||
    payload?.success === false;
  if (!response.ok || !payload || hasExplicitFailure) {
    const error = new Error(payload?.message || payload?.error || "Encarta status check failed");
    error.statusCode = 502;
    error.responseStatus = response.status;
    error.responseBody = payload;
    throw error;
  }

  const data = payload?.data || payload?.order || payload;
  const rawStatus = extractOrderStatus(payload);
  return {
    raw: data,
    status: normalizeStatus(rawStatus)
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeStatus
};
