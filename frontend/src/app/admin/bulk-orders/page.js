import { revalidatePath } from "next/cache";
import BulkOrdersClient from "./BulkOrdersClient";
import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function bulkUpdateAction(formData) {
  "use server";
  const targetStatus = String(formData.get("targetStatus") || "").trim().toUpperCase();
  const orderIdsRaw = formData.getAll("orderIds");
  const updateAll = formData.get("updateAll") === "true";
  const statusFilter = String(formData.get("statusFilter") || "").trim().toUpperCase() || null;
  const dateFrom = String(formData.get("dateFrom") || "").trim() || null;
  const dateTo = String(formData.get("dateTo") || "").trim() || null;

  if (!["PAID", "CREATED", "FULFILLED", "FAILED"].includes(targetStatus)) {
    return { error: "Invalid target status" };
  }

  const body = { status: targetStatus };

  if (updateAll) {
    body.statusFilter = statusFilter;
    body.dateFrom = dateFrom;
    body.dateTo = dateTo;
  } else if (orderIdsRaw.length > 0) {
    body.orderIds = orderIdsRaw;
  } else {
    return { error: "No orders selected and 'update all' not set" };
  }

  try {
    const data = await serverApi("/admin/orders/bulk/status", {
      method: "PATCH",
      body
    });
    revalidatePath("/admin/bulk-orders");
    return { success: true, updatedCount: data?.updatedCount || 0, targetStatus };
  } catch (error) {
    return { error: error.message || "Bulk update failed" };
  }
}

export default async function BulkOrdersPage({ searchParams }) {
  requireAdmin("/admin/bulk-orders");
  let orders = [];
  let pagination = null;

  try {
    const pageRaw = searchParams?.page;
    const page = Number.isFinite(Number(pageRaw)) ? Math.max(1, parseInt(pageRaw, 10)) : 1;
    const status = String(searchParams?.status || "").trim().toUpperCase();
    const dateFrom = String(searchParams?.dateFrom || "").trim();
    const dateTo = String(searchParams?.dateTo || "").trim();
    const search = String(searchParams?.search || "").trim();

    const params = new URLSearchParams({ page, limit: "50" });
    if (status && ["PAID", "CREATED", "FULFILLED", "FAILED"].includes(status)) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (search) params.set("search", search);

    const payload = await serverApi(`/admin/orders/bulk?${params.toString()}`);
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
    <BulkOrdersClient
      orders={orders}
      pagination={pagination}
      onBulkUpdate={bulkUpdateAction}
    />
  );
}
