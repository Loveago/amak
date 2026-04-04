"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PAID_STATUSES = new Set(["PAID", "FULFILLED"]);

function inferOrderNetwork(order) {
  const items = order?.items || [];
  const text = items
    .map((item) => [item?.product?.name, item?.product?.slug, item?.product?.category?.name, item?.product?.category?.slug])
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(mtn|yello)\b/.test(text)) return "MTN";
  if (/\b(telecel|vodafone)\b/.test(text)) return "TELECEL";
  if (/\b(airtel|tigo|at|at-ishare|at-bigtime|airteltigo)\b/.test(text)) return "AIRTELTIGO";
  return "Unknown";
}

export default function AdminOrdersClient({ orders, pagination, onFulfill }) {
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
              const isPaid = PAID_STATUSES.has(order.status);
              const network = inferOrderNetwork(order);
              const selectedStatus =
                order.status === "FULFILLED" ? "FULFILLED" : order.status === "PAID" ? "PAID" : "CREATED";
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
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${
                            isPaid ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                        <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink/70">
                          {network}
                        </span>
                      </div>
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
                      <p className="mt-1 text-xs text-ink/60">Network: {network}</p>
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
                  <div className="mt-4">
                    <form action={onFulfill} className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
                      <input type="hidden" name="orderId" value={order.id} />
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Order status</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink/80">
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" name="status" value="PAID" defaultChecked={selectedStatus === "PAID"} />
                          Paid
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="status"
                            value="CREATED"
                            defaultChecked={selectedStatus === "CREATED"}
                          />
                          Not Paid
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="status"
                            value="FULFILLED"
                            defaultChecked={selectedStatus === "FULFILLED"}
                          />
                          Delivered
                        </label>
                      </div>
                      <button
                        className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                      >
                        Update status
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {pagination ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5 text-xs">
            <p className="text-ink/60">
              Page <span className="font-semibold text-ink">{pagination.page}</span> of{" "}
              <span className="font-semibold text-ink">{pagination.totalPages}</span> ·{" "}
              <span className="font-semibold text-ink">{pagination.total}</span> total
            </p>
            <div className="flex items-center gap-2">
              {pagination.hasPrev ? (
                <Link
                  href={`/admin/orders?page=${pagination.page - 1}`}
                  className="rounded-full border border-ink/10 bg-white/80 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-ink"
                >
                  Prev
                </Link>
              ) : (
                <span className="rounded-full border border-ink/10 bg-white/50 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-ink/40">
                  Prev
                </span>
              )}
              {pagination.hasNext ? (
                <Link
                  href={`/admin/orders?page=${pagination.page + 1}`}
                  className="rounded-full bg-ink px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full bg-ink/20 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white/70">
                  Next
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
