import { revalidatePath } from "next/cache";
import AdminOrdersClient from "./AdminOrdersClient";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function fulfillOrder(formData) {
  "use server";
  const orderId = String(formData.get("orderId") || "").trim();
  const status = String(formData.get("status") || "").trim().toUpperCase();
  if (!orderId) {
    return;
  }
  if (!status) {
    return;
  }
  await serverApi(`/admin/orders/${orderId}/fulfill`, {
    method: "PATCH",
    body: { status }
  });
  revalidatePath("/admin/orders");
}

async function fulfillOrdersByHour(formData) {
  "use server";
  const date = String(formData.get("date") || "").trim();
  const hourRaw = formData.get("hour");
  const tzOffsetMinutesRaw = formData.get("tzOffsetMinutes");
  const hour = Number.isFinite(Number(hourRaw)) ? parseInt(String(hourRaw), 10) : null;
  const tzOffsetMinutes = Number.isFinite(Number(tzOffsetMinutesRaw))
    ? parseInt(String(tzOffsetMinutesRaw), 10)
    : 0;

  if (!date || hour === null) {
    return;
  }

  await serverApi("/admin/orders/fulfill-hour", {
    method: "PATCH",
    body: { date, hour, tzOffsetMinutes }
  });
  revalidatePath("/admin/orders");
}

export default async function AdminOrdersPage({ searchParams }) {
  requireAdmin("/admin/orders");
  let orders = [];
  let pagination = null;
  try {
    const pageRaw = searchParams?.page;
    const page = Number.isFinite(Number(pageRaw)) ? Math.max(1, parseInt(pageRaw, 10)) : 1;
    const payload = await serverApi(`/admin/orders?page=${page}&limit=10`);
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
    <AdminOrdersClient
      orders={orders}
      pagination={pagination}
      onFulfill={fulfillOrder}
      onBulkFulfillHour={fulfillOrdersByHour}
    />
  );
}
