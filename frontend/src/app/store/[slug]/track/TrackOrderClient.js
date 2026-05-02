"use client";

import { useState, useMemo } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const STATUS_META = {
  CREATED: {
    label: "Awaiting payment",
    short: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-400"
  },
  PAID: {
    label: "Payment confirmed",
    short: "Paid",
    className: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-400"
  },
  FULFILLED: {
    label: "Delivered successfully",
    short: "Delivered",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  FAILED: {
    label: "Delivery failed",
    short: "Failed",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500"
  },
  CANCELED: {
    label: "Canceled",
    short: "Canceled",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400"
  }
};

const PROVIDER_LABEL = {
  DELIVERED: "Provider: delivered",
  SUCCESS: "Provider: success",
  COMPLETED: "Provider: completed",
  PENDING: "Provider: pending",
  PROCESSING: "Provider: processing",
  NOT_SUBMITTED: "Not yet submitted",
  FAILED: "Provider: failed"
};

const STATUS_FILTER_OPTIONS = [
  { key: "ALL", label: "All" },
  { key: "FULFILLED", label: "Delivered" },
  { key: "PAID", label: "Paid" },
  { key: "CREATED", label: "Pending" },
  { key: "FAILED", label: "Failed" }
];

const resolveStatusMeta = (value) =>
  STATUS_META[String(value || "").toUpperCase()] || STATUS_META.CREATED;

const resolveProviderLabel = (value) =>
  PROVIDER_LABEL[String(value || "").toUpperCase()] || null;

function formatOrderDate(dateValue) {
  if (!dateValue) return { date: "", time: "" };
  const d = new Date(dateValue);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

export default function TrackOrderClient({ slug }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const lookupOrderStatus = async () => {
    const value = phone.trim();
    if (!value) {
      setError("Enter the recipient phone number used during checkout.");
      setResults([]);
      setSubmitted(true);
      return;
    }

    setLoading(true);
    setError("");
    setSubmitted(true);
    setStatusFilter("ALL");
    try {
      const response = await fetch(
        `${API_BASE}/store/${slug}/orders/status?phone=${encodeURIComponent(value)}`
      );
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Could not fetch order status.");
      }
      setResults(Array.isArray(payload.data) ? payload.data : []);
    } catch (lookupError) {
      setError(lookupError.message || "Could not fetch order status.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      lookupOrderStatus();
    }
  };

  const filteredResults = useMemo(() => {
    if (statusFilter === "ALL") return results;
    return results.filter((order) =>
      String(order.status || "").toUpperCase() === statusFilter
    );
  }, [results, statusFilter]);

  return (
    <section className="order-tracker-panel mt-6 glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="badge">Lookup</p>
        <h2 className="font-display text-2xl text-ink">Check your order status</h2>
        <p className="text-sm text-ink/60">
          Enter the <strong>recipient phone number</strong> used when placing your order.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-ink/40" aria-hidden="true">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              className="w-full rounded-full border border-ink/10 bg-white/90 py-3 pl-11 pr-4 text-sm text-ink shadow-sm focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
              placeholder="e.g. 0240000000 or +233240000000"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <button
            onClick={lookupOrderStatus}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:shrink-0"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Checking…
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                </svg>
                Check status
              </>
            )}
          </button>
        </div>
        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        ) : null}
      </div>

      {submitted && !loading && results.length > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <p className="text-xs text-ink/60">
              Found <strong className="text-ink">{results.length}</strong> order{results.length !== 1 ? "s" : ""} for this number
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] transition ${
                    statusFilter === opt.key
                      ? "bg-ink text-white"
                      : "border border-ink/15 bg-white/70 text-ink/60 hover:border-ink/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filteredResults.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {filteredResults.map((order) => {
                const statusMeta = resolveStatusMeta(order.status);
                const providerLabel = resolveProviderLabel(order.providerStatus);
                const { date, time } = formatOrderDate(order.createdAt);
                const shortId = order.id ? order.id.slice(-8).toUpperCase() : "—";
                return (
                  <div
                    key={order.id}
                    className="order-tracker-card rounded-2xl border border-ink/10 bg-white/85 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">Order ref</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold text-ink">#{shortId}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.short}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-ink/[0.03] px-3 py-2">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-ink/40" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-ink">{date}</p>
                        <p className="text-[11px] text-ink/50">{time}</p>
                      </div>
                    </div>

                    {order.customerName ? (
                      <p className="mt-2 text-xs text-ink/60">
                        <span className="font-medium text-ink/80">{order.customerName}</span>
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-ink/50">Amount</p>
                      <p className="text-sm font-semibold text-ink">
                        GHS {Number(order.totalAmountGhs || 0).toFixed(2)}
                      </p>
                    </div>

                    {providerLabel ? (
                      <p className="mt-2 text-[11px] text-ink/50">{providerLabel}</p>
                    ) : null}

                    {(order.items || []).length > 0 ? (
                      <ul className="mt-3 space-y-1 border-t border-ink/8 pt-3">
                        {(order.items || []).slice(0, 3).map((item) => (
                          <li key={item.id} className="flex items-center justify-between text-xs text-ink/70">
                            <span>
                              {item.productName}
                              {item.size ? ` · ${item.size}` : ""}
                            </span>
                            <span className="font-medium text-ink/80">×{item.quantity}</span>
                          </li>
                        ))}
                        {(order.items || []).length > 3 ? (
                          <li className="text-[11px] text-ink/40">
                            +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                          </li>
                        ) : null}
                      </ul>
                    ) : null}

                    <div className="mt-3 rounded-xl border border-ink/8 bg-ink/[0.02] px-3 py-2">
                      <p className="text-[11px] text-ink/50">{statusMeta.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-ink/20 px-4 py-5 text-center text-sm text-ink/50">
              No <strong>{STATUS_FILTER_OPTIONS.find((o) => o.key === statusFilter)?.label}</strong> orders for this number.
            </div>
          )}
        </>
      ) : submitted && !loading && !error ? (
        <div className="mt-5 rounded-2xl border border-dashed border-ink/20 bg-white/50 px-5 py-6 text-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-ink/20" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803M10.5 7.5v6m3-3h-6" />
            </svg>
            <p className="font-medium text-ink/60">No orders found for this number</p>
            <p className="text-xs text-ink/40">
              Make sure you enter the <strong>exact recipient phone</strong> used at checkout, including the leading 0 (e.g. 0240000000).
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
