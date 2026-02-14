const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const STATUS_MAP = {
  completed: "COMPLETED",
  processing: "PROCESSING",
  pending: "PENDING",
  failed: "FAILED",
  success: "SUCCESS",
  delivered: "DELIVERED"
};

const normalizeStatus = (value) => {
  if (!value) return "";
  const key = value.toString().trim().toLowerCase();
  return STATUS_MAP[key] || key.toUpperCase();
};

const GRANDAPI_NETWORK_MAP = {
  YELLO: "MTN",
  TELECEL: "TELECEL",
  AT_PREMIUM: "AIRTELTIGO",
  AT_BIGTIME: "AIRTELTIGO"
};

const resolveGrandapiNetwork = (encartaNetworkKey) => {
  if (!encartaNetworkKey) return null;
  return GRANDAPI_NETWORK_MAP[encartaNetworkKey] || null;
};

async function purchaseDataBundle({ networkKey, recipient, capacity }) {
  if (!env.grandapiApiKey) {
    const error = new Error("GrandAPI key missing");
    error.statusCode = 500;
    throw error;
  }

  const network = resolveGrandapiNetwork(networkKey);
  if (!network) {
    const error = new Error(`Cannot map network key "${networkKey}" to GrandAPI network`);
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    packages: [
      {
        packageId: String(Date.now()),
        size: capacity,
        network,
        type: "EXPIRING",
        phone: recipient
      }
    ]
  };

  const response = await fetcher(`${env.grandapiBaseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.grandapiApiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!data || data.status === false || data.success === false) {
    const msg = data?.error || data?.message || "GrandAPI purchase failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const orderId = data?.payload?.orderId || data?.payload?.orders?.[0]?.id;
  const firstOrder = data?.payload?.orders?.[0];
  const status = normalizeStatus(firstOrder?.status || "PROCESSING");

  return {
    raw: data,
    reference: orderId || null,
    status
  };
}

async function fetchOrderStatus(orderId) {
  if (!env.grandapiApiKey) {
    const error = new Error("GrandAPI key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(`${env.grandapiBaseUrl}/api/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "X-API-Key": env.grandapiApiKey
    }
  });

  const data = await response.json().catch(() => null);

  if (!data || (data.success === false && data.status === false)) {
    const msg = data?.error || data?.message || "GrandAPI status check failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const orderData = data?.data || data?.payload;
  const status = normalizeStatus(orderData?.status || "");

  return {
    raw: data,
    status
  };
}

async function fetchBalance() {
  if (!env.grandapiApiKey) {
    const error = new Error("GrandAPI key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(`${env.grandapiBaseUrl}/api/balance`, {
    headers: {
      "X-API-Key": env.grandapiApiKey
    }
  });

  const data = await response.json().catch(() => null);

  if (!data || data.status === false || data.success === false) {
    const msg = data?.error || data?.message || "Failed to fetch GrandAPI balance";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const payload = data.payload || data.data || {};
  return {
    raw: data,
    balance: Number(payload.balance) || 0,
    totalSales: Number(payload.totalSales) || 0,
    totalDeposit: Number(payload.totalDeposit) || 0,
    overDraft: Number(payload.overDraft) || 0
  };
}

module.exports = {
  purchaseDataBundle,
  fetchOrderStatus,
  normalizeStatus,
  resolveGrandapiNetwork,
  fetchBalance
};
