const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const DATAHUBNET_NETWORK_MAP = {
  YELLO: "mtn",
  TELECEL: "telecel",
  AT_PREMIUM: "ishare",
  AT_BIGTIME: "bigtime"
};

const resolveDatahubnetNetwork = (networkKey) => {
  if (!networkKey) return null;
  return DATAHUBNET_NETWORK_MAP[networkKey] || null;
};

const isLikelyAccepted = (responseOk, statusCode, payload) => {
  if (responseOk) return true;

  // DataHubNet docs mention this endpoint may return 404 even when called correctly.
  // If we still received a JSON object with an `error` field (possibly empty), treat as accepted.
  if (statusCode === 404 && payload && typeof payload.error === "string") {
    return true;
  }

  return false;
};

async function purchaseDataBundle({ networkKey, recipient, capacity, reference }) {
  if (!env.datahubnetApiKey) {
    const error = new Error("DataHubNet API key missing");
    error.statusCode = 500;
    throw error;
  }

  const network = resolveDatahubnetNetwork(networkKey);
  if (!network) {
    const error = new Error(`Cannot map network key "${networkKey}" to DataHubNet network`);
    error.statusCode = 400;
    throw error;
  }

  const payloadReference = reference ? String(reference) : `ref_${Date.now()}`;
  const qty = Math.max(1, Math.round(Number(capacity) || 1));

  const response = await fetcher(`${env.datahubnetBaseUrl}/api/v1/placeOrder/`, {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${env.datahubnetApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      phone: String(recipient || ""),
      network,
      capacity: qty,
      reference: payloadReference
    })
  });

  const payload = await response.json().catch(() => null);
  if (!isLikelyAccepted(response.ok, response.status, payload)) {
    const msg = payload?.error || payload?.message || "DataHubNet purchase failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    const error = new Error(payload.error.trim());
    error.statusCode = 502;
    throw error;
  }

  return {
    raw: payload,
    reference: payloadReference,
    status: "PLACED"
  };
}

async function fetchOrderStatus() {
  const error = new Error("DataHubNet status endpoint not supported");
  error.statusCode = 501;
  throw error;
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  resolveDatahubnetNetwork
};
