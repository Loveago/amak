const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export async function apiFetch(path, options = {}) {
  const { token, ...rest } = options;
  const headers = {
    "Content-Type": "application/json",
    ...(rest.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers,
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: payload?.error || response.statusText || "Request failed"
      };
    }

    return payload;
  } catch (error) {
    return { success: false, error: error.message || "API unavailable" };
  }
}
