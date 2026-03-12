import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";
import OrdersClient from "./OrdersClient";

export default async function AgentOrdersPage({ searchParams }) {
  requireAgent("/agent/orders");
  let orders = [];
  let pagination = null;
  try {
    const pageRaw = searchParams?.page;
    const page = Number.isFinite(Number(pageRaw)) ? Math.max(1, parseInt(pageRaw, 10)) : 1;
    const payload = await serverApi(`/agent/orders?page=${page}&limit=10`);
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
  return <OrdersClient orders={orders} pagination={pagination} />;
}
