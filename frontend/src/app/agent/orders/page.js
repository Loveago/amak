import { requireAgent } from "../../../lib/auth";
import { revalidatePath } from "next/cache";
import { serverApi } from "../../../lib/server-api";
import OrdersClient from "./OrdersClient";

async function recheckOrderPayment(formData) {
  "use server";
  const orderId = String(formData.get("orderId") || "").trim();
  if (!orderId) {
    return { error: "Order ID is required" };
  }

  try {
    const data = await serverApi(`/agent/orders/${orderId}/recheck-payment`, {
      method: "POST"
    });
    revalidatePath("/agent/orders");

    return {
      success: true,
      paid: Boolean(data?.paid),
      paystackStatus: String(data?.paystackStatus || "").toLowerCase(),
      orderStatus: data?.order?.status || null
    };
  } catch (error) {
    return { error: error.message || "Failed to recheck payment" };
  }
}

export default async function AgentOrdersPage({ searchParams }) {
  requireAgent("/agent/orders");
  let orders = [];
  let pagination = null;
  let scope = "all";
  try {
    const pageRaw = searchParams?.page;
    const page = Number.isFinite(Number(pageRaw)) ? Math.max(1, parseInt(pageRaw, 10)) : 1;
    const scopeRaw = String(searchParams?.scope || "all").trim().toLowerCase();
    scope = ["all", "direct", "downline"].includes(scopeRaw) ? scopeRaw : "all";
    const payload = await serverApi(`/agent/orders?page=${page}&limit=10&scope=${scope}`);
    orders = payload?.items || [];
    pagination = payload
      ? {
          page: payload.page,
          limit: payload.limit,
          total: payload.total,
          totalPages: payload.totalPages,
          hasPrev: payload.hasPrev,
          hasNext: payload.hasNext
        }
      : null;
  } catch (error) {
    orders = [];
    pagination = null;
  }
  return (
    <OrdersClient
      orders={orders}
      pagination={pagination}
      activeScope={scope}
      onRecheckOrderPayment={recheckOrderPayment}
    />
  );
}
