"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const STATUS_META = {
  CREATED: { label: "Pending payment", className: "bg-amber-100 text-amber-800" },
  PAID: { label: "Paid", className: "bg-sky-100 text-sky-700" },
  FULFILLED: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Failed", className: "bg-rose-100 text-rose-700" },
  CANCELED: { label: "Canceled", className: "bg-slate-200 text-slate-700" }
};

const PROVIDER_META = {
  DELIVERED: { label: "Provider delivered", className: "bg-emerald-50 text-emerald-700" },
  SUCCESS: { label: "Provider success", className: "bg-emerald-50 text-emerald-700" },
  COMPLETED: { label: "Provider completed", className: "bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Provider pending", className: "bg-sky-50 text-sky-700" },
  PROCESSING: { label: "Provider processing", className: "bg-sky-50 text-sky-700" },
  NOT_SUBMITTED: { label: "Not submitted", className: "bg-slate-100 text-slate-700" },
  FAILED: { label: "Provider failed", className: "bg-rose-50 text-rose-700" }
};

const resolveStatusMeta = (value) => STATUS_META[String(value || "").toUpperCase()] || STATUS_META.CREATED;
const resolveProviderMeta = (value) => PROVIDER_META[String(value || "").toUpperCase()] || null;

export default function TrackOrderClient({ slug }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const lookupOrderStatus = async () => {
    const value = phone.trim();
    if (!value) {
      setError("Enter the same phone number used at checkout.");
      setResults([]);
      setSubmitted(true);
      return;
    }

    setLoading(true);
    setError("");
    setSubmitted(true);
    try {
      const response = await fetch(`${API_BASE}/store/${slug}/orders/status?phone=${encodeURIComponent(value)}`);
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

  return (
    <section className="order-tracker-panel mt-6 glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="badge">Lookup</p>
          <h2 className="mt-3 font-display text-2xl text-ink">Check delivery status by phone number</h2>
          <p className="mt-1 text-sm text-ink/60">Use the recipient phone number that was entered during checkout.</p>
        </div>
        <div className="w-full lg:max-w-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError("");
              }}
              className="w-full rounded-full border border-ink/10 bg-white/90 px-4 py-3 text-sm text-ink shadow-sm focus:outline-none"
              placeholder="Enter phone number e.g. 0240000000"
            />
            <button
              onClick={lookupOrderStatus}
              disabled={loading}
              className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check status"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>

      {results.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {results.map((order) => {
            const statusMeta = resolveStatusMeta(order.status);
            const providerMeta = resolveProviderMeta(order.providerStatus);
            const createdAt = order.createdAt ? new Date(order.createdAt) : null;
            return (
              <div key={order.id} className="order-tracker-card rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{order.id}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/60">{createdAt ? createdAt.toLocaleString() : ""}</p>
                <p className="mt-1 text-xs text-ink/60">GHS {Number(order.totalAmountGhs || 0).toFixed(2)}</p>
                {providerMeta ? (
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${providerMeta.className}`}>
                    {providerMeta.label}
                  </span>
                ) : null}
                <ul className="mt-2 space-y-1 text-xs text-ink/70">
                  {(order.items || []).slice(0, 2).map((item) => (
                    <li key={item.id}>
                      {item.productName} {item.size ? `(${item.size})` : ""} · {item.quantity}x
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : submitted && !loading && !error ? (
        <div className="order-tracker-empty mt-5 rounded-2xl border border-dashed border-ink/20 px-4 py-5 text-sm text-ink/60">
          No orders found for this phone number yet.
        </div>
      ) : null}
    </section>
  );
}
