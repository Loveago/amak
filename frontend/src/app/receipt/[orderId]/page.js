import Link from "next/link";
import { serverApi } from "../../../lib/server-api";

export default async function ReceiptPage({ params }) {
  let order = null;
  try {
    order = await serverApi(`/store/orders/${params.orderId}/receipt`);
  } catch (error) {
    order = null;
  }

  if (!order) {
    return (
      <main className="min-h-screen receipt-shell">
        <div className="page-glow" />
        <div className="page-noise" />
        <div className="page-orb orb-1" />
        <div className="page-orb orb-2" />
        <div className="page-orb orb-3" />
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-16">
          <div className="card-outline fade-up rounded-3xl bg-surface-card/85 p-8 text-center">
            <p className="badge">Receipt</p>
            <h1 className="mt-3 font-display text-3xl text-ink">Receipt not found</h1>
            <p className="mt-3 text-sm text-ink-muted">
              We couldn&apos;t locate that order. Confirm the receipt link or check with the agent who fulfilled it.
            </p>
            <Link href="/" className="primary-cta mt-6">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const items = order.items || [];
  const total = Number(order.totalAmountGhs || 0);
  const agentSlug = order.agent?.slug || "";
  return (
    <main className="min-h-screen receipt-shell">
      <div className="page-glow" />
      <div className="page-noise" />
      <div className="page-orb orb-1" />
      <div className="page-orb orb-2" />
      <div className="page-orb orb-3" />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-14">
        <div className="receipt-hero card-outline fade-up rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="badge">Receipt</p>
              <h1 className="mt-3 font-display text-3xl text-ink">Order {order.id || params.orderId}</h1>
              <p className="text-sm text-ink-muted">Fulfilled by ABK Enterprise</p>
            </div>
            <div className="rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Total</p>
              <p className="mt-1 text-2xl font-semibold text-ink">GHS {total.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Status", value: order.status === "FULFILLED" ? "Fulfilled" : "Paid" },
              { label: "Delivery", value: "In progress" },
              { label: "Receipt", value: "SMS + Email" }
            ].map((item) => (
              <div key={item.label} className="storefront-stat rounded-2xl px-4 py-3 text-xs">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass rounded-3xl p-6 sm:p-7">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-accent/10 bg-surface-elevated p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Customer</p>
                <p className="mt-2 text-sm font-semibold text-ink">{order.customerName || "Guest"}</p>
                <p className="text-sm text-ink-muted">{order.customerPhone || "—"}</p>
              </div>
              <div className="rounded-2xl border border-accent/10 bg-surface-elevated p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Order status</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {order.status === "FULFILLED" ? "Fulfilled" : "Paid"} · Fulfillment in progress
                </p>
                <p className="text-sm text-ink-muted">Receipt sent to SMS + email</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-accent/10 bg-surface-card p-6">
              <h2 className="font-display text-2xl text-ink">Items</h2>
              <div className="mt-4 space-y-3 text-sm">
                {items.length === 0 ? (
                  <p className="text-sm text-ink-muted">No items were recorded on this order.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span>{item.product?.name}</span>
                      <span className="font-semibold text-ink">GHS {Number(item.totalPriceGhs).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 border-t border-accent/10 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>GHS {total.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-lg font-semibold text-ink">
                  <span>Total paid</span>
                  <span>GHS {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </section>

          <aside className="card-outline rounded-3xl bg-surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Payment summary</h2>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Paid
              </span>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Order ID</span>
                <span className="font-semibold text-ink">{order.id || params.orderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Recipient</span>
                <span className="font-semibold text-ink">{order.recipientPhone || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Storefront</span>
                <span className="font-semibold text-ink">{agentSlug || "ABK"}</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>GHS {total.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-lg font-semibold text-ink">
                <span>Total paid</span>
                <span>GHS {total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {agentSlug && (
                <Link href={`/store/${agentSlug}`} className="primary-cta w-full">
                  Back to storefront
                </Link>
              )}
              <button className="secondary-cta w-full">Download PDF</button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
