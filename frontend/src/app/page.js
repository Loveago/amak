import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Real-time Analytics",
    description: "Track sales, revenue, and agent performance in real time.",
    link: "Learn more"
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Secure & Reliable",
    description: "Enterprise-grade security to protect your business.",
    link: "Learn more"
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Grow Your Network",
    description: "Empower agents and affiliates to grow with you.",
    link: "Learn more"
  }
];

const stats = [
  { label: "Active agents", value: "482", change: "+16% vs last month", icon: "users" },
  { label: "Bundles sold", value: "12,940", change: "+24% vs last month", icon: "bundles" },
  { label: "Avg. profit", value: "GHS 1.30", change: "+8% vs last month", icon: "profit" },
  { label: "Affiliate payout", value: "GHS 3,120", change: "+18% vs last month", icon: "payout" }
];

const StatIcon = ({ type }) => {
  switch (type) {
    case "users":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
          <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
      );
    case "bundles":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
          <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
      );
    case "profit":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
          <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4-4 4 4"/></svg>
        </div>
      );
    case "payout":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
          <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 10v4M8 12h8"/></svg>
        </div>
      );
    default:
      return null;
  }
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <header className="flex flex-col gap-10">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <h1 className="font-display text-4xl leading-tight text-ink md:text-[3.5rem] md:leading-[1.1]">
                Ultra-modern storefronts for{" "}
                <span className="text-accent">Ghana&apos;s mobile data economy.</span>
              </h1>
              <p className="text-lg text-ink-muted">
                ABK Enterprise gives agents, affiliates, and admins a clean command center to sell
                data bundles, manage subscriptions, and reward growth in real time.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/store/ama-store"
                  className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-night shadow-glow"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  View storefront
                </Link>
                <Link
                  href="/agent/dashboard"
                  className="flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-ink"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  Agent portal
                </Link>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-surface bg-surface-elevated" />
                  ))}
                </div>
                <p className="text-sm text-ink-muted">
                  Trusted by <span className="font-semibold text-ink">10,000+</span> agents across Ghana
                </p>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="space-y-5 rounded-2xl bg-surface-card/80 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Live stats</p>
                    </div>
                    <h2 className="mt-2 font-display text-3xl text-ink">GHS 24,540</h2>
                  </div>
                  <span className="rounded-full bg-accent/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                    Revenue this month
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-accent/10 bg-surface/60 p-4">
                      <div className="flex items-center gap-2">
                        <StatIcon type={stat.icon} />
                        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{stat.label}</p>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-ink">{stat.value}</p>
                      <p className="mt-1 text-[10px] text-accent">{stat.change}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-20 grid gap-6 lg:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="card-outline rounded-3xl bg-surface-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                {item.icon}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
              <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent">
                {item.link} <span aria-hidden>→</span>
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
