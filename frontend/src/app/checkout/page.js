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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef7ed,transparent_60%),radial-gradient(circle_at_bottom,#f3f4ff,transparent_55%)]">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="badge">Checkout</p>
            <h1 className="mt-3 font-display text-3xl text-ink">Secure checkout</h1>
            <p className="text-sm text-ink/70">Complete your order and receive data instantly.</p>
          </div>
          <Link
            href={`/store/${slug}`}
            className="rounded-full border border-ink/15 bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Back to storefront
          </Link>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-ink">Delivery details</h2>
                <p className="text-sm text-ink/60">Recipient phone is required. Other details are optional.</p>
              </div>
              <span className="rounded-full bg-aurora/15 px-3 py-1 text-xs font-semibold text-ink">Paystack secure</span>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Recipient phone</p>
                <input
                  className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
                  placeholder="0240000000"
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                />
                <p className="mt-2 text-xs text-ink/50">Valid prefixes: 024, 054, 055, 059</p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Customer details</p>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">Optional</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
                    placeholder="Full name"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                  <input
                    className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                  />
                  <input
                    className="md:col-span-2 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
                    placeholder="Email address (for receipt)"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className="mt-6 w-full rounded-full bg-ink px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              onClick={handlePay}
              disabled={status.type === "loading" || loadingItems}
            >
              Pay with Paystack
            </button>
            {status.message && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${
                  status.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-ink/10 bg-white/80 text-ink/70"
                }`}
              >
                {status.message}
              </div>
            )}
            <p className="mt-4 text-xs text-ink/60">
              By completing this order you agree to AmaBaKinaata&apos;s fulfillment policies.
            </p>
          </section>

          <section className="card-outline rounded-3xl bg-white/90 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Order summary</h2>
              <span className="rounded-full bg-aurora/20 px-3 py-1 text-xs font-semibold text-ink">
                {loadingItems
                  ? "Loading"
                  : itemCount > 0
                  ? `${itemCount} bundle${itemCount > 1 ? "s" : ""}`
                  : "No bundles"}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {loadingItems ? (
                <p className="text-sm text-ink/60">Loading selected bundle...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-ink/60">No bundle selected yet.</p>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-semibold text-ink">GHS {Number(item.price).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 rounded-2xl border border-ink/10 bg-white/70 px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Recipient</span>
                <span className="font-semibold text-ink">{recipientPhone || "Not set"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Storefront</span>
                <span className="font-semibold text-ink">{slug}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-ink/10 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>GHS {total.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Paystack processing fee</span>
                <span>GHS {paystackFee.toFixed(2)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-lg font-semibold text-ink">
                <span>Total</span>
                <span>GHS {paystackTotal.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-[11px] text-ink/50">
                Fees estimated using Paystack public rates (1.95% + GHS 0.50 over GHS 100, capped at GHS 20).
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
