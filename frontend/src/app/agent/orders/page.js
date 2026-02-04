import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";
import OrdersClient from "./OrdersClient";

export default async function AgentOrdersPage() {
  requireAgent("/agent/orders");
  let orders = [];
  try {
    orders = await serverApi("/agent/orders");
  } catch (error) {
    orders = [];
  }
  return <OrdersClient orders={orders} />;
}
