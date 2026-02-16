"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

const PREFERRED_NETWORK_ORDER = ["mtn", "telecel", "airteltigoIshare", "airteltigoBigtime"];
const preferredNetworkPriority = new Map(
  PREFERRED_NETWORK_ORDER.map((key, index) => [key, index])
);

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

const getBundleSortKey = (bundle) => {
  const sizeMb = parseSizeToMb(bundle.size || bundle.name || "");
  if (sizeMb !== null) {
    return sizeMb;
  }
  return bundle.price || 0;
};

const getNetworkSortValue = (networkKey = "") => {
  const priority = preferredNetworkPriority.get(networkKey);
  return priority !== undefined ? priority : PREFERRED_NETWORK_ORDER.length;
};

export default function StorefrontClient({ store, slug }) {
  const router = useRouter();
  const audioContextRef = useRef(null);
  const categories = store?.categories || [];
  const bundles = useMemo(() => {
    const unsorted = categories.flatMap((category) => {
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
    });
    return unsorted.sort((a, b) => {
      const networkPriority = getNetworkSortValue(a.networkKey) - getNetworkSortValue(b.networkKey);
      if (networkPriority !== 0) {
        return networkPriority;
      }
      return getBundleSortKey(a) - getBundleSortKey(b);
    });
  }, [categories]);
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
    options.sort((a, b) => {
      const priority = getNetworkSortValue(a.key) - getNetworkSortValue(b.key);
      if (priority !== 0) {
        return priority;
      }
      return a.label.localeCompare(b.label);
    });
    return [{ key: "all", label: "All networks" }, ...options];
  }, [categories]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const filteredBundles = useMemo(() => {
    const base = activeFilter === "all" ? bundles : bundles.filter((bundle) => bundle.networkKey === activeFilter);
    const query = searchTerm.trim().toLowerCase();
    if (!query) return base;
    return base.filter((bundle) => {
      const name = bundle.name?.toLowerCase() || "";
      const size = bundle.size?.toLowerCase() || "";
      const network = bundle.network?.toLowerCase() || "";
      return name.includes(query) || size.includes(query) || network.includes(query);
    });
  }, [bundles, activeFilter, searchTerm]);
  const agentName = store?.agent?.name || slug.replace(/-/g, " ");
  const whatsappLink = store?.agent?.whatsappLink || "";

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const triggerHaptics = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const playClick = () => {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 220;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.06);
    } catch (error) {
      // Ignore audio failures.
    }
  };

  const microFeedback = () => {
    triggerHaptics();
    playClick();
  };

  useEffect(() => {
    setIsFiltering(true);
    const timeout = setTimeout(() => setIsFiltering(false), 280);
    return () => clearTimeout(timeout);
  }, [activeFilter, searchTerm]);

  const openModal = (bundle) => {
    setSelectedBundle(bundle);
    setRecipientPhone("");
    setPhoneError("");
    microFeedback();
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
    microFeedback();
    const target = `/checkout?slug=${slug}&productId=${selectedBundle.id}&qty=1&recipient=${encodeURIComponent(
      trimmed
    )}`;
    router.push(target);
  };

  const handleFilterChange = (filterKey) => {
    microFeedback();
    setActiveFilter(filterKey);
  };

  return (
    <main className="min-h-screen storefront-shell">
      <div className="storefront-orb orb-1" />
      <div className="storefront-orb orb-2" />
      <div className="storefront-orb orb-3" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <div className="storefront-hero card-outline fade-up rounded-[32px] p-6 sm:p-7">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="badge">Agent storefront</div>
              <h1 className="font-display text-3xl text-ink sm:text-4xl md:text-5xl">
                Welcome to <span className="text-emerald-600">{agentName}</span>
                <span className="text-ink"> Store</span>
              </h1>
              <p className="text-sm text-ink/70">
                Premium bundles, instant delivery, and a storefront that keeps you moving.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Instant delivery", value: "5-15 mins" },
                  { label: "Verified networks", value: "MTN • Telecel • AT" },
                  { label: "Support", value: "24/7 WhatsApp" }
                ].map((item) => (
                  <div key={item.label} className="storefront-stat rounded-2xl px-4 py-3 text-xs">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink/50">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="storefront-stat w-full rounded-3xl px-6 py-5 text-left sm:w-auto sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Quick checkout</p>
              <p className="mt-2 text-3xl font-semibold text-ink">GHS 0.00</p>
              <p className="text-xs text-ink/60">0 items selected</p>
              <Link
                href={`/checkout?slug=${slug}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white sm:w-auto"
              >
                Checkout
              </Link>
            </div>
          </div>
          <div className="relative z-10 mt-6 flex flex-col gap-3 lg:flex-row">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-full border border-ink/10 bg-white/90 px-4 py-3 text-sm text-ink shadow-sm focus:outline-none"
              placeholder="Search bundles, sizes, or networks..."
            />
            <button
              onClick={microFeedback}
              className="w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md sm:w-auto"
            >
              Explore
            </button>
          </div>

          <details className="group relative z-10 mt-5 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-[11px] text-amber-800">
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

        <div className="mt-10 flex items-center gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
          {filterOptions.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`filter-pill flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                activeFilter === filter.key ? "filter-pill-active" : "text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div
          className={`mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${isFiltering ? "filtering-grid" : ""}`}
        >
          {filteredBundles.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-ink/20 bg-white/70 p-10 text-center text-sm text-ink/60">
              No bundles are available yet for this storefront. Ask the agent to activate products in their portal.
            </div>
          ) : (
            filteredBundles.map((bundle) => (
              <div key={bundle.id} className="bundle-card card-outline fade-up rounded-3xl bg-white/90 p-5 sm:p-6">
                <div className="bundle-shine" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sand sm:h-10 sm:w-10">
                      <img src={bundle.networkIcon} alt={`${bundle.network} icon`} className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{bundle.network}</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Fast delivery
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-ink">{bundle.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/50">{bundle.size}</p>
                <p className="mt-3 text-sm text-ink/60">Price</p>
                <p className="text-2xl font-semibold text-ink">GHS {bundle.price.toFixed(2)}</p>
                <button
                  onClick={() => openModal(bundle)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Purchase bundle
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl animate-bounce"
          aria-label="Chat on WhatsApp"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="currentColor"
          >
            <path d="M20.52 3.5A11.87 11.87 0 0012.05 0C5.45 0 .1 5.35.1 11.95c0 2.1.55 4.15 1.6 5.95L0 24l6.3-1.65A11.87 11.87 0 0012.05 24h.05c6.6 0 11.95-5.35 11.95-11.95 0-3.2-1.25-6.2-3.53-8.55zm-8.47 18.4a9.9 9.9 0 01-5.05-1.4l-.35-.2-3.75 1 1-3.65-.25-.4a9.85 9.85 0 01-1.5-5.2c0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.05 1 6.9 2.85a9.72 9.72 0 012.9 6.95c0 5.4-4.4 9.85-9.7 9.85zm5.35-7.35c-.3-.15-1.75-.85-2.05-.95-.3-.1-.5-.15-.7.15-.2.3-.8.95-.95 1.15-.2.2-.35.25-.65.1-.3-.15-1.25-.45-2.4-1.45-.9-.8-1.5-1.75-1.65-2.05-.15-.3 0-.45.1-.6.1-.1.3-.35.45-.55.15-.2.2-.35.3-.55.1-.2.05-.4-.05-.55-.15-.15-.7-1.65-.95-2.25-.25-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0-.2 0-.55.1-.85.4-.3.3-1.1 1.05-1.1 2.55 0 1.5 1.1 2.95 1.25 3.15.15.2 2.15 3.25 5.2 4.55.75.3 1.35.5 1.8.65.75.25 1.45.2 2 .1.6-.1 1.75-.7 2-1.35.25-.65.25-1.2.2-1.35-.05-.15-.25-.25-.55-.4z" />
          </svg>
        </a>
      ) : null}

      {selectedBundle && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="modal-surface w-full max-w-lg rounded-3xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Enter Recipient Phone Number</h3>
                <p className="modal-subtitle">Please enter the phone number that will receive the data bundle.</p>
              </div>
              <button onClick={closeModal} className="modal-close" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-2">
              <label className="modal-label">Phone Number</label>
              <input
                value={recipientPhone}
                onChange={(event) => {
                  setRecipientPhone(event.target.value);
                  setPhoneError("");
                }}
                className="modal-input"
                placeholder="0240000000"
              />
              <p className="modal-hint">{PHONE_HINT}</p>
              {phoneError && <p className="modal-error">{phoneError}</p>}
            </div>

            <div className="modal-alert mt-5">
              Please ensure the phone number is correct. Data will be sent to this number and cannot be reversed.
            </div>

            <div className="modal-summary mt-5">
              <div className="modal-row">
                <span className="modal-label">Network</span>
                <span className="font-semibold text-ink">{selectedBundle.network}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Package</span>
                <span className="font-semibold text-ink">{selectedBundle.name}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Price</span>
                <span className="font-semibold text-ink">GHS {selectedBundle.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={closeModal} className="modal-button modal-button-ghost">
                Cancel
              </button>
              <button onClick={confirmPurchase} className="modal-button modal-button-primary">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
