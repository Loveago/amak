"use client";

import { useMemo, useState } from "react";

export default function AdminOrdersClient({ orders, onFulfill }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    if (!normalizedQuery) return orders;
    return orders.filter((order) => {
      const items = order.items || [];
      const haystack = [
        order.id,
        order.customerName,
        order.customerPhone,
        order.status,
        order.agent?.name,
        order.agent?.email,
        ...items.map((item) => item.product?.name)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [orders, normalizedQuery]);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Orders</h2>
            <p className="text-sm text-ink/60">Monitor order flow from payment to fulfillment.</p>
          </div>
          <div className="w-full max-w-sm">
            <label className="text-xs uppercase tracking-[0.2em] text-ink/60">Search orders</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order, agent, or bundle"
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No orders found. Try another search term.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const items = order.items || [];
              const createdAt = order.createdAt ? new Date(order.createdAt) : null;
              return (
                <div key={order.id} className="rounded-2xl border border-ink/10 bg-white/80 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Order</p>
                      <p className="mt-1 font-semibold text-ink">{order.id}</p>
                      <p className="mt-1 text-xs text-ink/60">{createdAt ? createdAt.toLocaleString() : ""}</p>
                      <p className="mt-1 text-xs text-ink/60">
                        {order.agent?.name || "Agent"} · {order.agent?.email || "No email"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Total</p>
                      <p className="mt-1 text-lg font-semibold text-ink">
                        GHS {Number(order.totalAmountGhs || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-ink/60">{order.status}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Recipient</p>
                      <p className="mt-1 font-semibold text-ink">{order.customerPhone || "Not provided"}</p>
                      <p className="text-xs text-ink/60">{order.customerName || "Guest customer"}</p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Bundles</p>
                      {items.length === 0 ? (
                        <p className="mt-1 text-xs text-ink/60">No items recorded.</p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-xs text-ink/70">
                          {items.map((item) => (
                            <li key={item.id || item.productId}>
                              {item.product?.name || "Bundle"} · {item.quantity}x
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <form action={onFulfill}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
                        disabled={order.status === "FULFILLED"}
                      >
                        {order.status === "FULFILLED" ? "Fulfilled" : "Mark fulfilled"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
