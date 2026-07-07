"use client";

import { useMemo, useState, useTransition } from "react";

const NETWORK_META = {
  mtn: { key: "mtn", label: "MTN", icon: "/icons/mtn.svg" },
  telecel: { key: "telecel", label: "Telecel", icon: "/icons/telecel.svg" },
  airteltigo: { key: "airteltigo", label: "AirtelTigo", icon: "/icons/airteltigo.svg" },
  other: { key: "other", label: "Other", icon: "/icons/data.svg" }
};

const NETWORK_ORDER = ["mtn", "telecel", "airteltigo", "other"];

const resolveNetworkKey = (name = "") => {
  const normalized = name.toLowerCase();
  if (normalized.includes("mtn")) return "mtn";
  if (normalized.includes("telecel")) return "telecel";
  if (normalized.includes("airtel") || normalized.includes("tigo") || normalized.includes("at ")) return "airteltigo";
  return "other";
};

const parseSizeToMb = (label = "") => {
  const valueMatch = label.replace(/,/g, "").match(/([\d.]+)/);
  if (!valueMatch) return null;
  const value = Number(valueMatch[1]);
  const unitMatch = label.match(/(tb|gb|mb|kb)/i);
  const unit = unitMatch ? unitMatch[1].toLowerCase() : "gb";
  switch (unit) {
    case "tb":
      return value * 1024 * 1024;
    case "gb":
      return value * 1024;
    case "mb":
      return value;
    case "kb":
      return value / 1024;
    default:
      return value;
  }
};

const getBundleSortKey = (product) => {
  const sizeMb = parseSizeToMb(product.size || product.name || "");
  if (sizeMb !== null) return sizeMb;
  return Number(product.basePriceGhs || 0);
};

const STEPS = [
  { id: 1, label: "Select" },
  { id: 2, label: "Number" },
  { id: 3, label: "Confirm" }
];

export default function DirectOrderClient({ products, balance, onSubmit }) {
  const [step, setStep] = useState(1);
  const [networkKey, setNetworkKey] = useState(null);
  const [productId, setProductId] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [isPending, startTransition] = useTransition();

  const networksAvailable = useMemo(() => {
    const found = new Set();
    products.forEach((p) => found.add(resolveNetworkKey(p.category?.name || "")));
    return NETWORK_ORDER.filter((key) => found.has(key));
  }, [products]);

  const productsForNetwork = useMemo(() => {
    if (!networkKey) return [];
    return products
      .filter((p) => resolveNetworkKey(p.category?.name || "") === networkKey)
      .sort((a, b) => getBundleSortKey(a) - getBundleSortKey(b));
  }, [products, networkKey]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

  const total = selectedProduct ? Number(selectedProduct.basePriceGhs || 0) * quantity : 0;

  const goToStep = (target) => {
    setError("");
    setStep(target);
  };

  const handleSelectNetwork = (key) => {
    setNetworkKey(key);
    setProductId("");
  };

  const handleSelectProduct = (id) => {
    setProductId(id);
    goToStep(2);
  };

  const handleContinueToConfirm = () => {
    if (!recipientPhone.trim()) {
      setError("Recipient phone number is required.");
      return;
    }
    if (!quantity || quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    goToStep(3);
  };

  const handleConfirm = () => {
    setError("");
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("recipientPhone", recipientPhone.trim());
    formData.set("quantity", String(quantity));
    if (customerName.trim()) {
      formData.set("customerName", customerName.trim());
    }
    startTransition(async () => {
      const result = await onSubmit(formData);
      if (!result?.success) {
        setError(result?.error || "Unable to place order");
        return;
      }
      setSuccess({
        productName: selectedProduct?.name,
        recipientPhone: recipientPhone.trim(),
        total
      });
      setStep(1);
      setNetworkKey(null);
      setProductId("");
      setRecipientPhone("");
      setCustomerName("");
      setQuantity(1);
    });
  };

  const startNewOrder = () => {
    setSuccess(null);
    setError("");
  };

  if (success) {
    return (
      <div className="card-outline rounded-3xl bg-white/90 p-6 sm:p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-emerald-600" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-xl text-ink">Order placed successfully</h3>
        <p className="mt-2 text-sm text-ink/60">
          {success.productName} sent to {success.recipientPhone}. Wallet debited GHS {success.total.toFixed(2)}.
        </p>
        <button
          onClick={startNewOrder}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <div className="card-outline rounded-3xl bg-white/90 p-6 sm:p-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((s, index) => (
          <div key={s.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                  step === s.id
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-md"
                    : step > s.id
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-ink/5 text-ink/40"
                }`}
              >
                {step > s.id ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span className={`text-sm font-semibold ${step === s.id ? "text-ink" : "text-ink/40"}`}>
                {s.label}
              </span>
            </div>
            {index < STEPS.length - 1 && <span className="text-ink/20">&gt;</span>}
          </div>
        ))}
      </div>

      {/* Wallet balance */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
        <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Wallet balance</span>
        <span className="font-semibold text-ink">GHS {balance}</span>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Select network + package */}
      {step === 1 && (
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/60">Select network</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {networksAvailable.length === 0 ? (
                <p className="col-span-full text-sm text-ink/50">No active products available.</p>
              ) : (
                networksAvailable.map((key) => {
                  const meta = NETWORK_META[key];
                  const active = networkKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectNetwork(key)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition ${
                        active
                          ? "border-emerald-400 bg-emerald-50/70 shadow-md"
                          : "border-ink/10 bg-white/80 hover:-translate-y-0.5 hover:shadow-md"
                      }`}
                    >
                      <img src={meta.icon} alt={`${meta.label} icon`} className="h-11 w-11 rounded-xl" />
                      <span className="text-xs font-semibold text-ink">{meta.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {networkKey && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/60">
                Select package
                <span className="ml-2 normal-case tracking-normal text-ink/40">(smallest to biggest)</span>
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {productsForNetwork.length === 0 ? (
                  <p className="col-span-full text-sm text-ink/50">No packages available for this network.</p>
                ) : (
                  productsForNetwork.map((p) => {
                    const active = productId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p.id)}
                        className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-emerald-400 bg-emerald-50/70 shadow-md"
                            : "border-ink/10 bg-white/80 hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                      >
                        <span className="text-xs uppercase tracking-[0.2em] text-ink/50">{p.size}</span>
                        <span className="mt-1 text-sm font-semibold text-ink">{p.name}</span>
                        <span className="mt-2 text-sm font-semibold text-emerald-700">
                          GHS {Number(p.basePriceGhs || 0).toFixed(2)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Number */}
      {step === 2 && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Selected package</p>
            <p className="mt-1 font-semibold text-ink">
              {selectedProduct?.name} ({selectedProduct?.size}) — GHS{" "}
              {Number(selectedProduct?.basePriceGhs || 0).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
              Recipient phone
            </label>
            <input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              type="tel"
              placeholder="e.g. 0240000000"
              className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                Customer name (optional)
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                type="text"
                placeholder="Customer name"
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Quantity</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                type="number"
                min="1"
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="secondary-cta"
            >
              Back
            </button>
            <button type="button" onClick={handleContinueToConfirm} className="primary-cta">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Package</span>
              <span className="font-semibold text-ink">
                {selectedProduct?.name} ({selectedProduct?.size})
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Recipient</span>
              <span className="font-semibold text-ink">{recipientPhone}</span>
            </div>
            {customerName && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Customer</span>
                <span className="font-semibold text-ink">{customerName}</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Quantity</span>
              <span className="font-semibold text-ink">{quantity}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-base">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-semibold text-ink">GHS {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => goToStep(2)} className="secondary-cta" disabled={isPending}>
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="primary-cta disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Placing order..." : "Confirm & pay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
