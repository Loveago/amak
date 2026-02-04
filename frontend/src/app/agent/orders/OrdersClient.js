"use client";

import { useMemo, useState } from "react";

const STATUS_STYLES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600"
};

const PAYMENT_STATUS_META = {
  CREATED: { label: "Awaiting payment", tone: "amber" },
  PAID: { label: "Paid", tone: "emerald" },
  FULFILLED: { label: "Paid", tone: "emerald" },
  FAILED: { label: "Payment failed", tone: "rose" },
  CANCELED: { label: "Canceled", tone: "slate" }
};

const PROVIDER_STATUS_META = {
  PLACED: { label: "Placed", tone: "sky" },
  SUBMITTED: { label: "Placed", tone: "sky" },
  PROCESSING: { label: "Processing", tone: "violet" },
  DELIVERED: { label: "Delivered", tone: "emerald" },
  SUCCESS: { label: "Delivered", tone: "emerald" },
  COMPLETED: { label: "Delivered", tone: "emerald" },
  FAILED: { label: "Failed", tone: "rose" },
  CANCELED: { label: "Canceled", tone: "slate" },
  PENDING: { label: "Pending", tone: "amber" },
  NOT_SUBMITTED: { label: "Not sent", tone: "slate" }
};

const normalizeStatus = (value) => (value ? value.toString().trim().toUpperCase() : "");

const resolveStatusMeta = (map, key, fallbackLabel = "Unknown") => {
  if (!key) {
    return { label: fallbackLabel, tone: "slate" };
  }
  return map[key] || { label: key.replace(/_/g, " "), tone: "slate" };
};

const buildBadgeClass = (tone) =>
  `inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
    STATUS_STYLES[tone] || STATUS_STYLES.slate
  }`;

const getProviderStatusKey = (order, paymentStatus) => {
  const rawProviderStatus =
    order.providerStatus ||
    order.processingStatus ||
    order.fulfillmentStatus ||
    order.apiStatus ||
    order.deliveryStatus ||
    order.vendorStatus;

  const normalized = normalizeStatus(rawProviderStatus);
  if (normalized) return normalized;
  if (paymentStatus === "FULFILLED") return "DELIVERED";
  if (paymentStatus === "FAILED") return "FAILED";
  if (paymentStatus === "CANCELED") return "CANCELED";
  if (paymentStatus === "PAID") return "SUBMITTED";
  return "NOT_SUBMITTED";
};

export default function OrdersClient({ orders }) {
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
        order.providerStatus,
        order.processingStatus,
        order.fulfillmentStatus,
        order.apiStatus,
        order.deliveryStatus,
        order.vendorStatus,
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
            <h2 className="font-display text-2xl text-ink">Orders pipeline</h2>
            <p className="text-sm text-ink/60">Track payment status, processing updates, and fulfillment details.</p>
          </div>
          <div className="w-full max-w-sm">
            <label className="text-xs uppercase tracking-[0.2em] text-ink/60">Search orders</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order, recipient, status, or bundle"
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-6">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No orders found. Try a different search or share your storefront link to get started.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const total = Number(order.totalAmountGhs || 0);
              const items = order.items || [];
              const createdAt = order.createdAt ? new Date(order.createdAt) : null;
              const paymentStatus = normalizeStatus(order.status);
              const paymentMeta = resolveStatusMeta(PAYMENT_STATUS_META, paymentStatus, "Pending");
              const providerStatusKey = getProviderStatusKey(order, paymentStatus);
              const providerMeta = resolveStatusMeta(PROVIDER_STATUS_META, providerStatusKey, "Not sent");
              return (
                <div key={order.id} className="rounded-2xl border border-ink/10 bg-white/80 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Order</p>
                      <p className="mt-1 font-semibold text-ink">{order.id}</p>
                      <p className="mt-1 text-xs text-ink/60">
                        {createdAt ? createdAt.toLocaleString() : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Total</p>
                      <p className="mt-1 text-lg font-semibold text-ink">GHS {total.toFixed(2)}</p>
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        <span className={buildBadgeClass(paymentMeta.tone)}>{paymentMeta.label}</span>
                        <span className={buildBadgeClass(providerMeta.tone)}>{providerMeta.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Recipient</p>
                      <p className="mt-1 font-semibold text-ink">{order.customerPhone || "Not provided"}</p>
                      <p className="text-xs text-ink/60">{order.customerName || "Guest customer"}</p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm">
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
                    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Status</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-ink/60">Payment</span>
                          <span className={buildBadgeClass(paymentMeta.tone)}>{paymentMeta.label}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-ink/60">Processing</span>
                          <span className={buildBadgeClass(providerMeta.tone)}>{providerMeta.label}</span>
                        </div>
                      </div>
                    </div>
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
