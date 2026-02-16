const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

 const PACKAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const PACKAGE_TYPES = ["EXPIRING", "NON_EXPIRING"];
const packageCache = new Map();

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

const extractStatusFromPayload = (payload) => {
  if (!payload) return "";
  if (payload.status) return payload.status;
  const packages =
    payload.packages || payload.savedPackages || payload.orders || payload.data || payload.items || [];
  if (Array.isArray(packages) && packages.length > 0) {
    return packages[0]?.status || "";
  }
  return "";
};

const approxEqual = (a, b) => Math.abs(a - b) < 0.01;

const buildPackageCacheKey = (network, type) => `${network}:${type}`;

async function fetchPackages({ network, type = "EXPIRING" }) {
  if (!env.grandapiApiKey) {
    const error = new Error("GrandAPI key missing");
    error.statusCode = 500;
    throw error;
  }

  if (!network) {
    const error = new Error("GrandAPI network required");
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = buildPackageCacheKey(network, type);
  const cached = packageCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < PACKAGE_CACHE_TTL_MS) {
    return cached.packages;
  }

  const url = new URL(`${env.grandapiBaseUrl}/api/packages`);
  url.searchParams.set("network", network);
  if (type) {
    url.searchParams.set("type", type);
  }

  const response = await fetcher(url.toString(), {
    headers: {
      "X-API-Key": env.grandapiApiKey
    }
  });

  const data = await response.json().catch(() => null);

  if (!data || data.status === false || data.success === false) {
    const msg = data?.error || data?.message || "Failed to fetch GrandAPI packages";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const packages = data.payload || data.data || [];
  packageCache.set(cacheKey, { packages, cachedAt: Date.now() });
  return packages;
}

const normalizeSize = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const matchPackageBySize = (packages, targetSize) => {
  if (!Number.isFinite(targetSize) || targetSize <= 0) {
    return null;
  }

  const candidates = packages
    .map((pkg) => ({ ...pkg, sizeNumber: normalizeSize(pkg.size) }))
    .filter((pkg) => Number.isFinite(pkg.sizeNumber));

  const variants = [targetSize, targetSize * 1024, targetSize / 1024];
  for (const variant of variants) {
    const match = candidates.find((pkg) => approxEqual(pkg.sizeNumber, variant));
    if (match) {
      return match;
    }
  }
  return null;
};

async function findPackageForCapacity(network, capacity) {
  for (const type of PACKAGE_TYPES) {
    const packages = await fetchPackages({ network, type });
    const match = matchPackageBySize(packages, Number(capacity));
    if (match) {
      return match;
    }
  }
  return null;
}

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

  const packageInfo = await findPackageForCapacity(network, capacity);
  if (!packageInfo) {
    const error = new Error(`GrandAPI package not found for ${network} capacity ${capacity}`);
    error.statusCode = 400;
    throw error;
  }

  const requestBody = {
    packages: [
      {
        packageId: packageInfo.id,
        size: packageInfo.size,
        network: packageInfo.network || network,
        type: packageInfo.type || "EXPIRING",
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
    body: JSON.stringify(requestBody)
  });

  const data = await response.json().catch(() => null);

  if (!data || data.status === false || data.success === false) {
    const msg = data?.error || data?.message || "GrandAPI purchase failed";
    const error = new Error(msg);
    error.statusCode = response.status || 502;
    throw error;
  }

  const responsePayload = data?.payload || data?.data || {};
  const orderId = responsePayload?.orderId || responsePayload?.id || responsePayload?.orders?.[0]?.id;
  const status = normalizeStatus(extractStatusFromPayload(responsePayload) || "PROCESSING");

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
  const status = normalizeStatus(extractStatusFromPayload(orderData));

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
  fetchBalance,
  fetchPackages
};
