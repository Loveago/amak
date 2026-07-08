"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

const PAID_STATUSES = new Set(["PAID", "FULFILLED"]);
const FAILED_PROVIDER_OPTIONS = ["ENCARTA", "GRANDAPI", "DATAHUBNET", "ELITENUT", "SHANKA", "XPRESS"];

function normalizeProvider(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "ELINUT") return "ELITENUT";
  if (upper === "ELITE_NUT") return "ELITENUT";
  if (upper === "SKANKA") return "SHANKA";
  return upper;
}

function getRetryProviderDefault(currentProvider) {
  if (!currentProvider) {
    return FAILED_PROVIDER_OPTIONS[0];
  }
  const alternative = FAILED_PROVIDER_OPTIONS.find((option) => option !== currentProvider);
  return alternative || FAILED_PROVIDER_OPTIONS[0];
}

function getOrderProvider(order) {
  return normalizeProvider(order?.providerPayload?.provider || order?.provider || order?.activeProvider);
}

function getProviderBadgeStyle(provider) {
  switch (provider) {
    case "ENCARTA":
      return { label: "Encarta", className: "bg-sky-500/50/10 text-sky-400" };
    case "GRANDAPI":
      return { label: "GrandAPI", className: "bg-violet-500/50/10 text-violet-400" };
    case "DATAHUBNET":
      return { label: "DataHubNet", className: "bg-yellow-500/10 text-yellow-400" };
    case "ELITENUT":
      return { label: "EliteNut", className: "bg-accent/10 text-accent" };
    case "SHANKA":
      return { label: "Shanka", className: "bg-rose-100 text-red-400" };
    case "XPRESS":
      return { label: "Xpress", className: "bg-cyan-100 text-cyan-700" };
    default:
      return null;
  }
}

function getPaymentSource(order) {
  if (!order) return null;
  const status = String(order.status || "").toUpperCase();
  const isPaid = status === "PAID" || status === "FULFILLED";
  if (!isPaid) return null;
  const ref = String(order.paymentRef || "").trim();
  if (!ref) {
    return { label: "Wallet", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" };
  }
  if (ref.startsWith("ADMIN_MANUAL_")) {
    return { label: "Manual", className: "bg-surface-elevated text-slate-600 ring-1 ring-slate-200" };
  }
  return { label: "Paystack", className: "bg-teal-50 text-teal-700 ring-1 ring-teal-100" };
}

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

function formatDateForInput(date) {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export default function AdminOrdersClient({
  orders,
  pagination,
  onFulfill,
  onRecheckOrderPayment,
  onUpdateFailedOrderProvider,
  onResendFailedOrder,
  onDeleteOrder
}) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState("");
  const [actionFeedback, setActionFeedback] = useState({});
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply search filter
    if (normalizedQuery) {
      result = result.filter((order) => {
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
    }

    // Apply date range filter (client-side as a supplement to server filter)
    if (dateFrom || dateTo) {
      result = result.filter((order) => {
        if (!order.createdAt) return true;
        const orderDate = new Date(order.createdAt);
        if (dateFrom && orderDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (orderDate > endDate) return false;
        }
        return true;
      });
    }

    return result;
  }, [orders, normalizedQuery, dateFrom, dateTo]);

  // Build query string for server-side date filtering
  const dateQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [dateFrom, dateTo]);

  const copyRecipientNumber = async (orderId, phone) => {
    const normalizedPhone = String(phone || "").trim();
    if (!normalizedPhone) {
      return;
    }

    try {
      await navigator.clipboard.writeText(normalizedPhone);
      setCopiedOrderId(orderId);
      setTimeout(() => {
        setCopiedOrderId((current) => (current === orderId ? "" : current));
      }, 1500);
    } catch (error) {
      setCopiedOrderId("");
    }
  };

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

  function handleRecheckPayment(orderId) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Orders</h2>
            <p className="text-sm text-ink-muted">Monitor order flow from payment to fulfillment.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/bulk-orders"
              className="rounded-full border border-accent/10 bg-surface-card px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent transition hover:bg-accent/10"
            >
              Bulk Status
            </Link>
            <div className="w-full max-w-xs">
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Search orders</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by order, agent, or bundle"
                className="mt-2 w-full rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card-outline rounded-3xl bg-surface-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-2 block rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-2 block rounded-2xl border border-accent/10 bg-surface-card px-4 py-3 text-sm"
              />
            </div>
            {(dateFrom || dateTo) ? (
              <button
                type="button"
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="rounded-full border border-red-500/30 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400"
              >
                Clear dates
              </button>
            ) : null}
          </div>
          {dateQueryString && pagination ? (
            <Link
              href={`/admin/orders?page=1&${dateQueryString}`}
              className="rounded-full bg-accent px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-night"
            >
              Apply server filter
            </Link>
          ) : null}
        </div>
      </div>

      {/* Orders List */}
      <div className="card-outline rounded-3xl bg-surface-card p-6">
        {filteredOrders.length > 0 ? (
          <div className="mb-4 flex items-center gap-2 border-b border-accent/10 pb-3">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            </span>
            {dateFrom || dateTo ? (
              <span className="rounded-full bg-ink/5 px-3 py-1 text-[10px] text-ink-muted">
                {dateFrom ? `From ${dateFrom}` : ""}
                {dateFrom && dateTo ? " — " : ""}
                {dateTo ? `To ${dateTo}` : ""}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/15 px-4 py-6 text-center text-sm text-ink-muted">
              No orders found. Try adjusting your search or date filter.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const items = order.items || [];
              const createdAt = order.createdAt ? new Date(order.createdAt) : null;
              const isPaid = PAID_STATUSES.has(order.status);
              const network = inferOrderNetwork(order);
              const provider = getOrderProvider(order);
              const providerBadge = provider ? getProviderBadgeStyle(provider) : null;
              const paymentSource = getPaymentSource(order);
              const isFailedOrder = order.status === "FAILED";
              const canRecheckPayment = order.status === "CREATED" && typeof onRecheckOrderPayment === "function";
              const selectedStatus =
                order.status === "FULFILLED" ? "FULFILLED" : order.status === "PAID" ? "PAID" : "CREATED";
              return (
                <div key={order.id} className="rounded-2xl border border-accent/10 bg-surface-card px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Order</p>
                      <p className="mt-1 font-semibold text-ink">{order.id}</p>
                      <p className="mt-1 text-xs text-ink-muted">{createdAt ? createdAt.toLocaleString() : ""}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {order.agent?.name || "Agent"} · {order.agent?.email || "No email"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${
                            isPaid ? "bg-accent/10 text-accent" : "bg-rose-100 text-red-400"
                          }`}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                        {providerBadge ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${providerBadge.className}`}
                            title={`Provider: ${provider}`}
                          >
                            {providerBadge.label}
                          </span>
                        ) : null}
                        {paymentSource ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.15em] ${paymentSource.className}`}
                            title={`Payment: ${paymentSource.label}`}
                          >
                            {paymentSource.label}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                          {network}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Total</p>
                      <p className="mt-1 text-lg font-semibold text-ink">
                        GHS {Number(order.totalAmountGhs || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-ink-muted">{order.status}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Recipient</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="font-semibold text-ink">{order.customerPhone || "Not provided"}</p>
                        <button
                          type="button"
                          onClick={() => copyRecipientNumber(order.id, order.customerPhone)}
                          disabled={!order.customerPhone}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-accent/10 text-ink-muted transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Copy recipient number"
                          aria-label="Copy recipient number"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                            <path
                              d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h7.5A2.25 2.25 0 0 1 21 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 9 17.25v-7.5Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M15 7.5V6.75A2.25 2.25 0 0 0 12.75 4.5h-7.5A2.25 2.25 0 0 0 3 6.75v7.5a2.25 2.25 0 0 0 2.25 2.25H6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                        {copiedOrderId === order.id ? <span className="text-[10px] text-accent">Copied</span> : null}
                      </div>
                      <p className="text-xs text-ink-muted">{order.customerName || "Guest customer"}</p>
                      <p className="mt-1 text-xs text-ink-muted">Network: {network}</p>
                    </div>
                    <div className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3">
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
                  </div>
                  <div className="mt-4">
                    <form action={onFulfill} className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3">
                      <input type="hidden" name="orderId" value={order.id} />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Order status</p>
                        {canRecheckPayment ? (
                          <button
                            type="submit"
                            formAction={handleRecheckPayment(order.id)}
                            disabled={isPending}
                            className="rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-400"
                          >
                            Check payment fallback
                          </button>
                        ) : null}
                      </div>
                      {canRecheckPayment ? renderActionFeedback(order.id) : null}
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
                        className="mt-3 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night"
                      >
                        Update status
                      </button>
                    </form>
                  </div>
                  {isFailedOrder && typeof onUpdateFailedOrderProvider === "function" && typeof onResendFailedOrder === "function" ? (
                    <div className="mt-3">
                      <form className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                        <input type="hidden" name="orderId" value={order.id} />
                        <p className="text-xs uppercase tracking-[0.2em] text-red-400">Failed order actions</p>
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                          <select
                            name="provider"
                            defaultValue={getRetryProviderDefault(provider)}
                            className="w-full rounded-xl border border-red-500/20 bg-surface-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-rose-800 sm:w-auto"
                          >
                            {FAILED_PROVIDER_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              formAction={onUpdateFailedOrderProvider}
                              className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400"
                            >
                              Change provider
                            </button>
                            <button
                              type="submit"
                              formAction={onResendFailedOrder}
                              className="rounded-full bg-rose-600 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-night"
                            >
                              Resend order
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : null}
                  {typeof onDeleteOrder === "function" ? (
                    <div className="mt-3">
                      <form action={onDeleteOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/5"
                          onClick={(e) => {
                            if (!confirm(`Delete order ${order.id}? This cannot be undone.`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete order
                        </button>
                      </form>
                    </div>
                  ) : null}
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
                  href={`/admin/orders?page=${pagination.page - 1}`}
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
                  href={`/admin/orders?page=${pagination.page + 1}`}
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
