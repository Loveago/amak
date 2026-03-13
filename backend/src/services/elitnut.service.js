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

const ELITENUT_NETWORK_MAP = {
  YELLO: "MTN",
  TELECEL: "TELECEL",
  AT_PREMIUM: "AT",
  AT_BIGTIME: "AT"
};

const normalizeNetwork = (networkKey) => {
  if (!networkKey) return null;
  return ELITENUT_NETWORK_MAP[networkKey] || null;
};

const normalizeStatus = (value) => {
  if (!value) return "";
  const key = value.toString().trim().toLowerCase();

  if (key.includes("order") && key.includes("placed")) return "PROCESSING";
  if (key.includes("placed") && (key.includes("success") || key.includes("successful") || key.includes("successfully"))) {
    return "PROCESSING";
  }
  if (key.includes("processing")) return "PROCESSING";
  if (key.includes("pending")) return "PENDING";
  if (key.includes("failed") || key.includes("error")) return "FAILED";
  if (key.includes("delivered")) return "DELIVERED";
  if (key.includes("complete") || key.includes("completed")) return "COMPLETED";
  if (key.includes("success")) return "SUCCESS";

  if (key === "completed") return "COMPLETED";
  if (key === "delivered") return "DELIVERED";
  if (key === "success") return "SUCCESS";
  if (key === "processing") return "PROCESSING";
  if (key === "pending") return "PENDING";
  if (key === "failed") return "FAILED";
  return key.toUpperCase();
};

const extractStatusFromPayload = (payload) => {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload) && payload.length > 0) return extractStatusFromPayload(payload[0]);

  const direct = payload.status || payload.state || payload.message;
  if (typeof direct === "string" && direct.trim()) return direct;

  const nestedCandidates = [payload.data, payload.payload, payload.transaction, payload.result];
  for (const candidate of nestedCandidates) {
    if (candidate && candidate !== payload) {
      const nested = extractStatusFromPayload(candidate);
      if (nested) return nested;
    }
  }

  return "";
};

const resolvePackageMb = (capacity) => {
  const num = Number(capacity);
  if (!Number.isFinite(num) || num <= 0) return null;

  // EliteNut expects packages in MB (1000, 2000, ...).
  // In our catalog capacity is sometimes expressed as GB (1, 2, 3...).
  // Heuristic: values below 100 are treated as GB.
  const mb = num < 100 ? num * 1000 : num;
  return Math.max(1, Math.round(mb));
};

async function purchaseDataBundle({ networkKey, recipient, capacity, reference }) {
  if (!env.elitnutApiKey) {
    const error = new Error("EliteNut API key missing");
    error.statusCode = 500;
    throw error;
  }

  const network = normalizeNetwork(networkKey);
  if (!network) {
    const error = new Error(`Cannot map network key "${networkKey}" to EliteNut network`);
    error.statusCode = 400;
    throw error;
  }

  const packageMb = resolvePackageMb(capacity);
  if (!packageMb) {
    const error = new Error("EliteNut package invalid");
    error.statusCode = 400;
    throw error;
  }

  const ref = reference ? String(reference) : `ref_${Date.now()}`;

  const response = await fetchWithTimeout(`${env.elitnutBaseUrl}/api_init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.elitnutApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      network,
      number: String(recipient || ""),
      reference: ref,
      package: packageMb
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = payload?.error || payload?.message || "EliteNut purchase failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const status = normalizeStatus(extractStatusFromPayload(payload) || "PROCESSING");

  return {
    raw: payload,
    reference: ref,
    status
  };
}

async function fetchOrderStatus(reference, networkKey) {
  if (!env.elitnutApiKey) {
    const error = new Error("EliteNut API key missing");
    error.statusCode = 500;
    throw error;
  }

  const network = normalizeNetwork(networkKey);
  if (!network) {
    const error = new Error("EliteNut network required");
    error.statusCode = 400;
    throw error;
  }

  const url = new URL(`${env.elitnutBaseUrl}/api_req`);
  url.searchParams.set("network", network);
  if (reference) {
    url.searchParams.set("reference", String(reference));
  }

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.elitnutApiKey}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = payload?.error || payload?.message || "EliteNut status check failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const status = normalizeStatus(extractStatusFromPayload(payload));

  return {
    raw: payload,
    status
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeNetwork,
  normalizeStatus
};
