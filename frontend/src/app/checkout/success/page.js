"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const slug = searchParams.get("slug") || "";
  const reference = searchParams.get("reference") || "";
  const receiptHref = orderId ? `/receipt/${orderId}` : "/";
  const storefrontHref = slug ? `/store/${slug}` : "/store/ama-store";
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    let active = true;
    if (!reference) {
      setStatus({ type: "idle", message: "" });
      return () => {
        active = false;
      };
    }

    setStatus({ type: "loading", message: "Verifying payment..." });
    fetch(`${API_BASE}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference })
    })
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        if (!payload?.success) {
          throw new Error(payload?.error || "Unable to verify payment");
        }
        setStatus({ type: "success", message: "Payment verified. Receipt is ready." });
      })
      .catch((error) => {
        if (!active) return;
        setStatus({ type: "error", message: error.message || "Unable to verify payment" });
      });

    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 pb-20 pt-20">
        <div className="glass rounded-3xl p-10 text-center">
          <p className="badge">Payment complete</p>
          <h1 className="mt-4 font-display text-3xl text-ink md:text-4xl">Bundle purchase successful.</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Your order is being fulfilled. A receipt has been sent to your phone and email.
          </p>
          {status.message && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-xs ${
                status.type === "error"
                  ? "border-red-500/20 bg-red-500/5 text-red-400"
                  : "border-accent/10 bg-surface-card text-ink-muted"
              }`}
            >
              {status.message}
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={receiptHref}
              className={`rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-night ${
                orderId ? "bg-ink" : "bg-ink/50 pointer-events-none"
              }`}
            >
              View receipt
            </Link>
            <Link
              href={storefrontHref}
              className="rounded-full border border-accent/15 bg-surface-elevated px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              Back to storefront
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
