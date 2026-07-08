"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

const STATUS_STYLES = {
  emerald: "border-accent/20 bg-accent/10 text-accent",
  amber: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  rose: "border-red-500/20 bg-red-500/5 text-red-400",
  sky: "border-sky-500/20 bg-sky-500/5 text-sky-400",
  violet: "border-violet-500/20 bg-violet-500/5 text-violet-400",
  slate: "border-slate-200 bg-surface-elevated text-slate-600"
};

const PAYMENT_STATUS_META = {
  CREATED: { label: "Awaiting payment", tone: "amber" },
  PAID: { label: "Paid", tone: "emerald" },
  FULFILLED: { label: "Paid", tone: "emerald" },
  FAILED: { label: "Payment failed", tone: "rose" },
  CANCELED: { label: "Canceled", tone: "slate" }
};

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

const ORDER_SCOPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "direct", label: "Direct" },
  { value: "downline", label: "Downline" }
];

export default function OrdersClient({ orders, pagination, activeScope = "all", onRecheckOrderPayment }) {
  const [query, setQuery] = useState("");
  const [actionFeedback, setActionFeedback] = useState({});
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = query.trim().toLowerCase();

  function clearFeedbackLater(orderId, delayMs = 4500) {
    setTimeout(() => {
      setActionFeedback((prev) => {
        if (!prev[orderId]) return prev;
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, delayMs);
  }

  function handleRecheckPayment(orderId, onRecheckOrderPayment) {
    return (formData) => {
      if (typeof onRecheckOrderPayment !== "function") {
        return;
      }

      startTransition(async () => {
        setActionFeedback((prev) => ({
          ...prev,
          [orderId]: { type: "loading", message: "Checking Paystack fallback..." }
        }));

        const result = await onRecheckOrderPayment(formData);
        if (result?.error) {
          setActionFeedback((prev) => ({
            ...prev,
            [orderId]: { type: "error", message: result.error }
          }));
          return;
        }

        if (result?.paid) {
          setActionFeedback((prev) => ({
            ...prev,
            [orderId]: {
              type: "success",
              message:
                result?.orderStatus === "PAID" || result?.orderStatus === "FULFILLED"
                  ? "Payment confirmed. Order settled and queued for dispatch."
                  : "Payment confirmed. Order was updated."
            }
          }));
          clearFeedbackLater(orderId);
          return;
        }

        setActionFeedback((prev) => ({
          ...prev,
          [orderId]: { type: "info", message: "No successful Paystack payment found yet." }
        }));
        clearFeedbackLater(orderId);
      });
    };
  }

  function renderActionFeedback(orderId) {
    const feedback = actionFeedback[orderId];
    if (!feedback) {
      return null;
    }

    if (feedback.type === "loading") {
      return <p className="mt-2 text-[11px] text-ink-muted">{feedback.message}</p>;
    }

    if (feedback.type === "error") {
      return <p className="mt-2 text-[11px] text-red-400">{feedback.message}</p>;
    }

    if (feedback.type === "success") {
      return <p className="mt-2 text-[11px] text-accent">{feedback.message}</p>;
    }

    return <p className="mt-2 text-[11px] text-yellow-400">{feedback.message}</p>;
  }

  const filteredOrders = useMemo(() => {
    if (!normalizedQuery) return orders;
    return orders.filter((order) => {
      const items = order.items || [];
      const haystack = [
        order.id,
        order.customerName,
        order.customerPhone,
        order.status,
        order.visibilityScope,
        order.sourceAgent?.name,
        order.sourceAgent?.slug,
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
            <p className="text-sm text-ink-muted">Track payment status, processing updates, and fulfillment details.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ORDER_SCOPE_OPTIONS.map((option) => {
                const isActive = activeScope === option.value;
                return (
                  <Link
                    key={option.value}
                    href={`/agent/orders?scope=${option.value}`}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      isActive
                        ? "bg-accent text-night"
                        : "border border-accent/10 bg-surface-card text-ink-muted hover:bg-surface-card"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="w-full max-w-sm">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Search orders</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order, recipient, status, or bundle"
              className="mt-2 w-full rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-6 text-center text-sm text-ink-muted">
              No orders found. Try a different search or share your storefront link to get started.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const total = Number(order.totalAmountGhs || 0);
              const items = order.items || [];
              const createdAt = order.createdAt ? new Date(order.createdAt) : null;
              const paymentStatus = normalizeStatus(order.status);
              const isPaid = PAID_STATUSES.has(paymentStatus);
              const network = inferOrderNetwork(order);
              const paymentMeta = resolveStatusMeta(PAYMENT_STATUS_META, paymentStatus, "Pending");
              const providerStatusKey = getProviderStatusKey(order, paymentStatus);
              const providerMeta = resolveStatusMeta(PROVIDER_STATUS_META, providerStatusKey, "Not sent");
              const downlineLabel =
                order.visibilityScope === "DOWNLINE_LEVEL_2" ? "Level 2 downline" : "Level 1 downline";
              const canRecheckPayment =
                paymentStatus === "CREATED" && !order.isIndirect && typeof onRecheckOrderPayment === "function";
              return (
                <div key={order.id} className="rounded-2xl border border-accent/10 bg-surface-card px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Order</p>
                      <p className="mt-1 font-semibold text-ink">{order.id}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {createdAt ? createdAt.toLocaleString() : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${
                            isPaid ? "bg-accent/10 text-accent" : "bg-rose-100 text-red-400"
                          }`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                        {order.isIndirect ? (
                          <span className="rounded-full bg-violet-500/50/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-violet-400">
                            {downlineLabel}
                          </span>
                        ) : (
                          <span className="rounded-full bg-sky-500/50/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-sky-400">
                            Direct order
                          </span>
                        )}
                        <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                          {network}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Total</p>
                      <p className="mt-1 text-lg font-semibold text-ink">GHS {total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Recipient</p>
                      <p className="mt-1 font-semibold text-ink">{order.customerPhone || "Not provided"}</p>
                      <p className="text-xs text-ink-muted">{order.customerName || "Guest customer"}</p>
                      {order.isIndirect ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          Source agent: {order.sourceAgent?.name || order.sourceAgent?.slug || downlineLabel}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-ink-muted">Network: {network}</p>
                    </div>
                    <div className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Bundles</p>
                      {items.length === 0 ? (
                        <p className="mt-1 text-xs text-ink-muted">No items recorded.</p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-xs text-ink-muted">
                          {items.map((item) => (
                            <li key={item.id || item.productId}>
                              {item.product?.name || "Bundle"} · {item.quantity}x
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Status</p>
                        {canRecheckPayment ? (
                          <form action={onRecheckOrderPayment}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <button
                              type="submit"
                              formAction={handleRecheckPayment(order.id, onRecheckOrderPayment)}
                              disabled={isPending}
                              className="rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-400"
                            >
                              Check payment fallback
                            </button>
                          </form>
                        ) : null}
                      </div>
                      {canRecheckPayment ? renderActionFeedback(order.id) : null}
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-ink-muted">Payment</span>
                          <span className={buildBadgeClass(paymentMeta.tone)}>{paymentMeta.label}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-ink-muted">Processing</span>
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
        {pagination ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-accent/10 pt-5 text-xs">
            <p className="text-ink-muted">
              Page <span className="font-semibold text-ink">{pagination.page}</span> of{" "}
              <span className="font-semibold text-ink">{pagination.totalPages}</span> ·{" "}
              <span className="font-semibold text-ink">{pagination.total}</span> total
            </p>
            <div className="flex items-center gap-2">
              {pagination.hasPrev ? (
                <Link
                  href={`/agent/orders?page=${pagination.page - 1}&scope=${activeScope}`}
                  className="rounded-full border border-accent/10 bg-surface-card px-4 py-2 font-semibold uppercase tracking-[0.2em] text-ink"
                >
                  Prev
                </Link>
              ) : (
                <span className="rounded-full border border-accent/10 bg-surface-elevated px-4 py-2 font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  Prev
                </span>
              )}
              {pagination.hasNext ? (
                <Link
                  href={`/agent/orders?page=${pagination.page + 1}&scope=${activeScope}`}
                  className="rounded-full bg-accent px-4 py-2 font-semibold uppercase tracking-[0.2em] text-night"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full bg-ink/20 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-night/70">
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
