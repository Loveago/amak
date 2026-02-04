import { revalidatePath } from "next/cache";
import AdminOrdersClient from "./AdminOrdersClient";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function fulfillOrder(formData) {
  "use server";
  const orderId = String(formData.get("orderId") || "").trim();
  if (!orderId) {
    return;
  }
  await serverApi(`/admin/orders/${orderId}/fulfill`, { method: "PATCH" });
  revalidatePath("/admin/orders");
}

export default async function AdminOrdersPage() {
  requireAdmin("/admin/orders");
  let orders = [];
  try {
    orders = await serverApi("/admin/orders");
  } catch (error) {
    orders = [];
  }
  return <AdminOrdersClient orders={orders} onFulfill={fulfillOrder} />;
}
