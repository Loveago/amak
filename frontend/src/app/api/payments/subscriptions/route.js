import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export async function POST(request) {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE}/payments/subscriptions/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: payload?.error || "Unable to initialize subscription" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: payload.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Unable to initialize subscription" },
      { status: 500 }
    );
  }
}
