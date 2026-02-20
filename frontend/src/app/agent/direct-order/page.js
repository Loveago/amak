import { revalidatePath } from "next/cache";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

async function placeDirectOrder(formData) {
  "use server";
  const productId = String(formData.get("productId") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const quantity = Number(formData.get("quantity") || 1);
  if (!productId || !recipientPhone) {
    return;
  }
  await serverApi("/agent/direct-orders", {
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

  const categoryMap = new Map();
  activeProducts.forEach((p) => {
    const catName = p.category?.name || "Other";
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, []);
    }
    categoryMap.get(catName).push(p);
  });

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <p className="badge">Direct Order</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Place an order from your wallet</h2>
        <p className="text-sm text-ink/60">
          Select a product and enter the recipient phone number. Your wallet will be debited immediately.
        </p>
        <p className="mt-2 text-sm font-semibold text-ink">
          Wallet balance: GHS {balance}
        </p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <h3 className="font-display text-xl text-ink">New Order</h3>
        <form action={placeDirectOrder} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Product</label>
            <select
              name="productId"
              required
              className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            >
              <option value="">Select a product</option>
              {Array.from(categoryMap.entries()).map(([catName, catProducts]) => (
                <optgroup key={catName} label={catName}>
                  {catProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.size}) — GHS {Number(p.basePriceGhs || 0).toFixed(2)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Recipient Phone</label>
            <input
              name="recipientPhone"
              type="tel"
              required
              className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              placeholder="e.g. 0240000000"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Customer Name (optional)</label>
              <input
                name="customerName"
                type="text"
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Quantity</label>
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              />
            </div>
          </div>
          <button className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Place order
          </button>
        </form>
      </div>
    </div>
  );
}
