"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PHONE_HINT = "Valid prefixes: 024, 054, 055, 059";
const NETWORK_ASSETS = {
  mtn: { label: "MTN", icon: "/icons/mtn.svg" },
  telecel: { label: "Telecel", icon: "/icons/telecel.svg" },
  airteltigo: { label: "AirtelTigo", icon: "/icons/airteltigo.svg" },
  airteltigoBigtime: { label: "AT Bigtime", icon: "/icons/airteltigo.svg" },
  airteltigoIshare: { label: "AT Ishare", icon: "/icons/airteltigo.svg" },
  default: { label: "Other", icon: "/icons/data.svg" }
};

const resolveNetworkMeta = (name = "") => {
  const normalized = name.toLowerCase();
  if (normalized.includes("mtn")) return { key: "mtn", ...NETWORK_ASSETS.mtn };
  if (normalized.includes("telecel")) return { key: "telecel", ...NETWORK_ASSETS.telecel };
  if (normalized.includes("bigtime") || normalized.includes("atbig")) {
    return { key: "airteltigoBigtime", ...NETWORK_ASSETS.airteltigoBigtime };
  }
  if (normalized.includes("ishare")) {
    return { key: "airteltigoIshare", ...NETWORK_ASSETS.airteltigoIshare };
  }
  if (normalized.includes("airtel") || normalized.includes("tigo") || normalized.includes("at ")) {
    return { key: "airteltigo", ...NETWORK_ASSETS.airteltigo };
  }
  return { key: "default", ...NETWORK_ASSETS.default };
};

export default function StorefrontClient({ store, slug }) {
  const router = useRouter();
  const categories = store?.categories || [];
  const bundles = useMemo(
    () =>
      categories.flatMap((category) => {
        const networkMeta = resolveNetworkMeta(category.name);
        return category.products.map((product) => ({
          id: product.id,
          name: product.name,
          size: product.size,
          price: Number(product.sellPriceGhs || 0),
          network: networkMeta.label,
          networkKey: networkMeta.key,
          networkIcon: networkMeta.icon
        }));
      }),
    [categories]
  );
  const filterOptions = useMemo(() => {
    const uniqueNetworks = new Map();
    categories.forEach((category) => {
      const meta = resolveNetworkMeta(category.name);
      if (!uniqueNetworks.has(meta.key)) {
        uniqueNetworks.set(meta.key, meta);
      }
    });
    const options = Array.from(uniqueNetworks.entries()).map(([key, meta]) => ({
      key,
      label: meta.label
    }));
    return [{ key: "all", label: "All networks" }, ...options];
  }, [categories]);
  const [activeFilter, setActiveFilter] = useState("all");
  const filteredBundles = useMemo(() => {
    if (activeFilter === "all") return bundles;
    return bundles.filter((bundle) => bundle.networkKey === activeFilter);
  }, [bundles, activeFilter]);
  const agentName = store?.agent?.name || slug.replace(/-/g, " ");

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const openModal = (bundle) => {
    setSelectedBundle(bundle);
    setRecipientPhone("");
    setPhoneError("");
  };

  const closeModal = () => {
    setSelectedBundle(null);
    setRecipientPhone("");
    setPhoneError("");
  };

  const confirmPurchase = () => {
    const trimmed = recipientPhone.trim();
    if (!trimmed) {
      setPhoneError("Please enter the recipient phone number.");
      return;
    }
    const target = `/checkout?slug=${slug}&productId=${selectedBundle.id}&qty=1&recipient=${encodeURIComponent(
      trimmed
    )}`;
    router.push(target);
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="badge">Agent storefront</div>
              <h1 className="font-display text-2xl text-ink sm:text-3xl md:text-4xl">
                Welcome to {agentName} Store
              </h1>
              <p className="text-sm text-ink/70">Premium bundles with instant delivery in Ghana.</p>
            </div>
            <div className="w-full rounded-2xl border border-ink/10 bg-white/80 px-5 py-4 text-left sm:w-auto sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Your cart</p>
              <p className="mt-2 text-2xl font-semibold text-ink">GHS 0.00</p>
              <p className="text-xs text-ink/60">0 items</p>
              <Link
                href={`/checkout?slug=${slug}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white sm:w-auto"
              >
                Checkout
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <input
              className="w-full rounded-full border border-ink/10 bg-white/80 px-4 py-3 text-sm text-ink focus:outline-none"
              placeholder="Search bundles..."
            />
            <button className="w-full rounded-full bg-aurora px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white sm:w-auto">
              Search
            </button>
          </div>

          <details className="group mt-4 rounded-xl border border-amber-200/50 bg-amber-50/40 px-3 py-2 text-[11px] text-amber-800">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
              Important notice
              <span className="text-sm font-bold text-amber-500 transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="mt-2 space-y-1.5 text-[11px] text-amber-700/90">
              <p>Make sure the phone number is correct before proceeding.</p>
              <p>
                SIMs not supported: Transfer/EVD, TurboNet/Fibre, Inactive/Dormant SIMs, SIMs owing airtime.
              </p>
              <p>Info: Packages do not expire. Check balance via MyMTN App.</p>
              <p>Please allow between 15 to 60 minutes for delivery.</p>
              <p>If not received within this timeframe, contact support within 24 hours for assistance.</p>
              <p>
                Disclaimer: AmabaKinaata Ent will not be responsible for any issues arising from a violation of
                these conditions.
              </p>
            </div>
          </details>
        </div>

        <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
          {filterOptions.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                activeFilter === filter.key
                  ? "bg-ink text-white"
                  : "border border-ink/10 bg-white/70 text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBundles.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-ink/20 bg-white/70 p-10 text-center text-sm text-ink/60">
              No bundles are available yet for this storefront. Ask the agent to activate products in their portal.
            </div>
          ) : (
            filteredBundles.map((bundle) => (
              <div key={bundle.id} className="card-outline rounded-3xl bg-white/90 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sand sm:h-10 sm:w-10">
                      <img src={bundle.networkIcon} alt={`${bundle.network} icon`} className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{bundle.network}</span>
                  </div>
                  <span className="rounded-full bg-aurora/10 px-3 py-1 text-xs font-semibold text-ink">
                    Fast delivery
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-ink">{bundle.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/50">{bundle.size}</p>
                <p className="mt-3 text-sm text-ink/60">Price</p>
                <p className="text-2xl font-semibold text-ink">GHS {bundle.price.toFixed(2)}</p>
                <button
                  onClick={() => openModal(bundle)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Purchase bundle
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-7 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink">Enter Recipient Phone Number</h3>
                <p className="mt-1 text-sm text-ink/60">
                  Please enter the phone number that will receive the data bundle.
                </p>
              </div>
              <button onClick={closeModal} className="text-lg text-ink/40">✕</button>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Phone Number</label>
              <input
                value={recipientPhone}
                onChange={(event) => {
                  setRecipientPhone(event.target.value);
                  setPhoneError("");
                }}
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
                placeholder="0240000000"
              />
              <p className="text-xs text-ink/50">{PHONE_HINT}</p>
              {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Please ensure the phone number is correct. Data will be sent to this number and cannot be reversed.
            </div>

            <div className="mt-5 rounded-2xl border border-ink/10 bg-white/70 px-4 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Network</span>
                <span className="font-semibold text-ink">{selectedBundle.network}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Package</span>
                <span className="font-semibold text-ink">{selectedBundle.name}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">Price</span>
                <span className="font-semibold text-ink">GHS {selectedBundle.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-full border border-ink/15 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
