import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function buildHeaders(token, extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) return null;
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    return null;
  }
  return payload?.data?.tokens || null;
}

function trySetTokens(cookieStore, tokens) {
  if (!tokens?.accessToken) return;
  try {
    cookieStore.set("accessToken", tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 15
    });
    if (tokens.refreshToken) {
      cookieStore.set("refreshToken", tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 7
      });
    }
  } catch (error) {
    // Ignore cookie update failures in server components.
  }
}

export async function serverApi(path, options = {}) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  let token = accessToken;

  if (!token && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    if (tokens?.accessToken) {
      token = tokens.accessToken;
      trySetTokens(cookieStore, tokens);
    }
  }

  let headers = buildHeaders(token, options.headers);
  const config = {
    method: options.method || "GET",
    cache: "no-store",
    ...options,
    headers
  };

  if (options.body && typeof options.body !== "string") {
    config.body = JSON.stringify(options.body);
  }

  let response = await fetch(`${API_BASE}${path}`, config);
  let payload = await response.json().catch(() => null);

  if ((response.status === 401 || payload?.error === "Missing token") && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    if (tokens?.accessToken) {
      trySetTokens(cookieStore, tokens);
      headers = buildHeaders(tokens.accessToken, options.headers);
      response = await fetch(`${API_BASE}${path}`, { ...config, headers });
      payload = await response.json().catch(() => null);
    }
  }

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.error || response.statusText || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}
