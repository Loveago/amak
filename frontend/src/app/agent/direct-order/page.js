import { revalidatePath } from "next/cache";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";
import DirectOrderClient from "./DirectOrderClient";

async function placeDirectOrder(formData) {
  "use server";
  const productId = String(formData.get("productId") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const quantity = Number(formData.get("quantity") || 1);
  if (!productId || !recipientPhone) {
    return { success: false, error: "Product and recipient phone are required." };
  }
  try {
    const data = await serverApi("/agent/direct-orders", {
      method: "POST",
      body: {
        productId,
        recipientPhone,
        quantity: quantity || 1,
        ...(customerName ? { customerName } : {})
      }
    });
    revalidatePath("/agent/direct-order");
    revalidatePath("/agent/orders");
    revalidatePath("/agent/wallet");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message || "Unable to place order" };
  }
}

export default async function AgentDirectOrderPage() {
  requireAgent("/agent/direct-order");

  let products = [];
  let wallet = null;
  try {
    [products, wallet] = await Promise.all([
      serverApi("/agent/products"),
      serverApi("/agent/wallet")
    ]);
  } catch (error) {
    products = [];
    wallet = null;
  }

  const balance = Number(wallet?.balanceGhs ?? 0).toFixed(2);
  const activeProducts = (products || []).filter((p) => p.basePriceGhs !== null);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Direct Order</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Place an order from your wallet</h2>
        <p className="text-sm text-ink-muted">
          Select a network, choose a package, and enter the recipient phone number. Your wallet will be debited
          immediately.
        </p>
      </div>

      <DirectOrderClient products={activeProducts} balance={balance} onSubmit={placeDirectOrder} />
    </div>
  );
}
