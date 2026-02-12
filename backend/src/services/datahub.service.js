const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const DEFAULT_BASE_URL = "https://www.datahubnet.online";

const buildHeaders = () => ({
  Authorization: `Api-Key ${env.datahubApiKey}`,
  "Content-Type": "application/json"
});

const normalizeNetwork = (value) => (value ? value.toString().trim().toLowerCase() : "");

async function purchaseDataBundle({ network, recipient, capacity, reference, express }) {
  if (!env.datahubApiKey) {
    const error = new Error("DataHub API key missing");
    error.statusCode = 500;
    throw error;
  }

  const payload = {
    phone: recipient,
    network: normalizeNetwork(network),
    capacity: Number.isFinite(capacity) ? Math.round(capacity) : capacity,
    reference
  };
  if (typeof express === "boolean") {
    payload.express = express;
  }

  const response = await fetcher(`${env.datahubBaseUrl || DEFAULT_BASE_URL}/api/v1/placeOrder/`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);
  const errorMessage = typeof data?.error === "string" ? data.error.trim() : "";

  if (errorMessage) {
    const error = new Error(errorMessage);
    error.statusCode = response.status || 502;
    throw error;
  }

  return {
    raw: { statusCode: response.status, payload: data },
    reference,
    status: response.ok ? "PLACED" : "SUBMITTED"
  };
}

module.exports = {
  purchaseDataBundle
};
