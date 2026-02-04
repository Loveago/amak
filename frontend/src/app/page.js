import Link from "next/link";

const highlights = [
  {
    title: "Instant bundle delivery",
    description: "Sell MTN, Telecel, and AirtelTigo data in seconds with real-time pricing and automated receipts."
  },
  {
    title: "Wallet-first profits",
    description: "Every markup and commission lands directly in your wallet with transparent ledgers and audit trails."
  },
  {
    title: "Affiliate momentum",
    description: "Grow a three-level referral tree that rewards performance while preventing loops or fraud."
  }
];

const workflow = [
  {
    step: "01",
    title: "Admin sets base prices",
    description: "Control network pricing, product status, and plan limits from the command center."
  },
  {
    step: "02",
    title: "Agents activate bundles",
    description: "Agents select products, add markup, and publish branded storefronts instantly."
  },
  {
    step: "03",
    title: "Customers checkout",
    description: "Paystack handles secure payments while orders flow into fulfillment queues."
  }
];

const plans = [
  { name: "Basic", price: "GHS 10", limit: "10 products" },
  { name: "Premium", price: "GHS 25", limit: "20 products" },
  { name: "Elite", price: "GHS 40", limit: "50 products" }
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <header className="flex flex-col gap-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="badge">AmaBaKinaata Enterprise</div>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="rounded-full bg-white/70 px-4 py-2">Ghana-first data commerce</span>
              <span className="text-ink/70">Paystack-ready</span>
            </div>
          </div>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <h1 className="font-display text-4xl leading-tight text-ink md:text-6xl">
                Ultra-modern storefronts for Ghana&apos;s mobile data economy.
              </h1>
              <p className="text-lg text-ink/70">
                AmaBaKinaata Enterprise gives agents, affiliates, and admins a clean command center to sell
                data bundles, manage subscriptions, and reward growth in real time.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/store/ama-store"
                  className="rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-glow"
                >
                  View storefront
                </Link>
                <Link
                  href="/agent/dashboard"
                  className="rounded-full border border-ink/20 bg-white/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
                >
                  Agent portal
                </Link>
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="space-y-6 rounded-2xl bg-white/80 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/60">Live stats</p>
                    <h2 className="font-display text-3xl text-ink">GHS 24,540</h2>
                  </div>
                  <span className="rounded-full bg-aurora/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                    Revenue this month
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Active agents", value: "482" },
                    { label: "Bundles sold", value: "12,940" },
                    { label: "Avg. profit", value: "GHS 1.30" },
                    { label: "Affiliate payout", value: "GHS 3,120" }
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/60">{stat.label}</p>
                      <p className="mt-2 text-xl font-semibold text-ink">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-20 grid gap-6 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="card-outline rounded-3xl bg-white/80 p-6">
              <h3 className="font-display text-2xl text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="badge">Platform workflow</p>
            <h2 className="font-display text-3xl text-ink">Designed for fast scaling, no chaos.</h2>
            <p className="text-ink/70">
              Every order, payout, and subscription lives in a single secure system with role-based access
              controls and auditable ledger entries.
            </p>
          </div>
          <div className="grid gap-4">
            {workflow.map((item) => (
              <div key={item.step} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-ink/70">{item.step}</span>
                  <span className="rounded-full bg-ink/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/60">
                    Core
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="badge">Subscription plans</p>
              <h2 className="font-display text-3xl text-ink">Scale your product catalog with clarity.</h2>
            </div>
            <Link
              href="/agent/subscription"
              className="rounded-full bg-night px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Manage subscription
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="card-outline rounded-3xl bg-white/90 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{plan.name}</p>
                <h3 className="mt-3 text-3xl font-semibold text-ink">{plan.price}</h3>
                <p className="mt-2 text-sm text-ink/70">{plan.limit} active bundles</p>
                <button className="mt-6 w-full rounded-full bg-aurora px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  Choose plan
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-outline rounded-3xl bg-white/90 p-6">
            <p className="badge">Affiliate system</p>
            <h2 className="mt-4 font-display text-3xl text-ink">Three levels of commissions.</h2>
            <p className="mt-3 text-sm text-ink/70">
              Invite new agents, prevent fraud, and automatically credit every commission in a transparent ledger.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {["3%", "2%", "1%"].map((rate, index) => (
                <div key={rate} className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Level {index + 1}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{rate}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <h3 className="font-display text-2xl text-ink">Launch your storefront today.</h3>
            <p className="mt-3 text-sm text-ink/70">
              Every agent gets a personal link, branded storefront, and performance dashboard to manage sales.
            </p>
            <div className="mt-6 space-y-3">
              {["/store/jessica-data", "/store/ama-elite", "/store/bright-bundles"].map((link) => (
                <div key={link} className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink">
                  {link}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
