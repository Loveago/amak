import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const secure = process.env.NODE_ENV === "production";

function setSessionCookies(data) {
  const cookieStore = cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/"
  };

  cookieStore.set("accessToken", data.tokens.accessToken, {
    ...options,
    maxAge: 60 * 15
  });
  cookieStore.set("refreshToken", data.tokens.refreshToken, {
    ...options,
    maxAge: 60 * 60 * 24 * 7
  });
  cookieStore.set("user", JSON.stringify(data.user), {
    ...options,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: payload?.error || "Invalid credentials" },
        { status: response.status }
      );
    }

    setSessionCookies(payload.data);
    return NextResponse.json({ success: true, data: payload.data.user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  ["accessToken", "refreshToken", "user"].forEach((key) => cookieStore.delete(key));
  return NextResponse.json({ success: true });
}
