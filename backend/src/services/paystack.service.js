const env = require("../config/env");

const fetcher = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function initializeTransaction({ email, amountGhs, reference, callbackUrl, metadata }) {
  if (!env.paystackSecret) {
    const error = new Error("Paystack secret key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecret}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountGhs * 100),
      reference,
      callback_url: callbackUrl,
      metadata
    })
  });

  const payload = await response.json();
  if (!payload.status) {
    const error = new Error(payload.message || "Paystack init failed");
    error.statusCode = 502;
    throw error;
  }

  return payload.data;
}

async function verifyTransaction(reference) {
  if (!env.paystackSecret) {
    const error = new Error("Paystack secret key missing");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${env.paystackSecret}` }
    }
  );

  const payload = await response.json();
  if (!payload.status) {
    const error = new Error(payload.message || "Paystack verify failed");
    error.statusCode = 502;
    throw error;
  }

  return payload.data;
}

module.exports = { initializeTransaction, verifyTransaction };
