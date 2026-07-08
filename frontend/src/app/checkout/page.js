"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { computePaystackGross } from "../../lib/paystackFees";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "ama-store";
  const productId = searchParams.get("productId");
  const qtyParam = Number(searchParams.get("qty") || 1);
  const recipientPrefill = searchParams.get("recipient") || "";
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState(recipientPrefill);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    if (recipientPrefill) {
      setRecipientPhone(recipientPrefill);
    }
  }, [recipientPrefill]);

  useEffect(() => {
    let active = true;
    const loadStore = async () => {
      setLoadingItems(true);
      try {
        const storeResponse = await fetch(`${API_BASE}/store/${slug}`).then((res) => res.json());
        if (!storeResponse?.success) {
          throw new Error(storeResponse?.error || "Storefront unavailable");
        }

        const categories = storeResponse.data?.categories || [];
        const products = categories.flatMap((category) =>
          category.products.map((product) => ({
            ...product,
            category: category.name
          }))
        );

        let selectedProduct = null;
        if (productId) {
          selectedProduct = products.find((product) => product.id === productId) || null;
        }
        if (!selectedProduct && products.length > 0) {
          selectedProduct = products[0];
        }

        if (active) {
          if (selectedProduct) {
            setItems([
              {
                productId: selectedProduct.id,
                name: selectedProduct.name,
                price: Number(selectedProduct.sellPriceGhs || 0),
                quantity: Number.isFinite(qtyParam) && qtyParam > 0 ? qtyParam : 1
              }
            ]);
          } else {
            setItems([]);
          }
        }
      } catch (error) {
        if (active) {
          setStatus({ type: "error", message: error.message || "Unable to load storefront" });
          setItems([]);
        }
      } finally {
        if (active) {
          setLoadingItems(false);
        }
      }
    };

    loadStore();
    return () => {
      active = false;
    };
  }, [slug, productId, qtyParam]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const { fee: paystackFee, gross: paystackTotal } = useMemo(() => computePaystackGross(total), [total]);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const handlePay = async () => {
    if (items.length === 0) {
      setStatus({ type: "error", message: "Please select a bundle before paying." });
      return;
    }

    const recipientValue = recipientPhone.trim();
    if (!recipientValue) {
      setStatus({ type: "error", message: "Recipient phone number is required." });
      return;
    }

    const emailValue = email.trim();
    if (emailValue && !emailValue.includes("@")) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    const paymentEmail = emailValue || `guest+${Date.now()}@amabkinaata.com`;

    setStatus({ type: "loading", message: "Initializing payment..." });
    try {
      const orderPayload = {
        recipientPhone: recipientValue,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      };
      const nameValue = customerName.trim();
      const phoneValue = customerPhone.trim();
      if (nameValue) {
        orderPayload.customerName = nameValue;
      }
      if (phoneValue) {
        orderPayload.customerPhone = phoneValue;
      }
      const orderResponse = await fetch(`${API_BASE}/store/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      }).then((res) => res.json());

      if (!orderResponse?.success) {
        throw new Error(orderResponse?.error || "Unable to create order");
      }

      const paymentResponse = await fetch(`${API_BASE}/payments/orders/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderResponse.data.id, email: paymentEmail })
      }).then((res) => res.json());

      if (!paymentResponse?.success) {
        throw new Error(paymentResponse?.error || "Unable to initialize payment");
      }

      const redirectUrl = paymentResponse.data?.authorization_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setStatus({ type: "success", message: "Payment initialized. Complete payment in Paystack." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Payment failed" });
    }
  };

  return (
    <main className="min-h-screen checkout-shell bg-surface">
      <div className="page-glow" />
      <div className="page-noise" />
      <div className="page-orb orb-1" />
      <div className="page-orb orb-2" />
      <div className="page-orb orb-3" />
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <div className="checkout-hero card-outline fade-up rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="badge">Checkout</p>
              <h1 className="mt-3 font-display text-3xl text-ink">Secure checkout</h1>
              <p className="text-sm text-ink-muted">Complete your order and receive data instantly.</p>
            </div>
            <Link href={`/store/${slug}`} className="rounded-full border border-accent/20 bg-surface-card px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-accent/40">
              Back to storefront
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Instant delivery", value: "5-15 mins" },
              { label: "Paystack secured", value: "Verified checkout" },
              { label: "Support", value: "24/7 WhatsApp" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-3 text-xs">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass rounded-3xl p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-ink">Delivery details</h2>
                <p className="text-sm text-ink-muted">Recipient phone is required. Other details are optional.</p>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Paystack secure
              </span>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="rounded-2xl border border-accent/10 bg-surface-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Recipient phone</p>
                <input
                  className="mt-3 w-full rounded-xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                  placeholder="0240000000"
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                />
                <p className="mt-2 text-xs text-ink-muted">Valid prefixes: 024, 054, 055, 059</p>
              </div>

              <div className="rounded-2xl border border-accent/10 bg-surface-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Customer details</p>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Optional</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    className="w-full rounded-xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                    placeholder="Full name"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none md:col-span-2"
                    placeholder="Email address (for receipt)"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className="mt-6 w-full rounded-full bg-accent px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-night shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handlePay}
              disabled={status.type === "loading" || loadingItems}
            >
              Pay with MoMo
            </button>
            {status.message && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${
                  status.type === "error"
                    ? "border-red-500/20 bg-red-500/50/5 text-red-400"
                    : "border-accent/10 bg-surface-card text-ink-muted"
                }`}
              >
                {status.message}
              </div>
            )}
            <p className="mt-4 text-xs text-ink-muted">
              By completing this order you agree to ABK&apos;s fulfillment policies.
            </p>
          </section>

          <section className="card-outline rounded-3xl bg-surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Order summary</h2>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {loadingItems
                  ? "Loading"
                  : itemCount > 0
                  ? `${itemCount} bundle${itemCount > 1 ? "s" : ""}`
                  : "No bundles"}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {loadingItems ? (
                <p className="text-sm text-ink-muted">Loading selected bundle...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-ink-muted">No bundle selected yet.</p>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{item.name}</span>
                    <span className="font-semibold text-ink">GHS {Number(item.price).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 rounded-2xl border border-accent/10 bg-surface-elevated px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Recipient</span>
                <span className="font-semibold text-ink">{recipientPhone || "Not set"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Storefront</span>
                <span className="font-semibold text-ink">{slug}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-accent/10 pt-4 text-sm">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Subtotal</span>
                <span>GHS {total.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-ink-muted">
                <span>Paystack processing fee</span>
                <span>GHS {paystackFee.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-lg font-semibold text-ink">
                <span>Total</span>
                <span>GHS {paystackTotal.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-[11px] text-ink-muted">
                Fees estimated using Paystack public rates (1.95% + GHS 0.50 over GHS 100, capped at GHS 20).
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
