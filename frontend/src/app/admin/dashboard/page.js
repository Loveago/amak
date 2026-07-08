import { requireAdmin } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AdminDashboardPage() {
  requireAdmin("/admin/dashboard");
  let data = null;
  try {
    data = await serverApi("/admin/dashboard");
  } catch (error) {
    data = null;
  }

  const chartData = data?.chartData ?? [];
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  const stats = [
    { label: "Total orders", value: `${data?.orders ?? 0}`, icon: "clipboard", change: `${data?.todayOrders ?? 0} today` },
    { label: "Active agents", value: `${data?.agents ?? 0}`, icon: "users", change: `${data?.totalProducts ?? 0} products` },
    { label: "Total revenue", value: `GHS ${Number(data?.revenueTotal ?? 0).toFixed(2)}`, icon: "trending", change: `GHS ${Number(data?.revenueTotal ?? 0).toFixed(2)}` },
    { label: "AFA registrations", value: `${data?.afaRegistrations ?? 0}`, icon: "clipboard", change: `${data?.pendingOrders ?? 0} pending` },
    { label: "Wallet payouts", value: `GHS ${Number(data?.walletPayouts ?? 0).toFixed(2)}`, icon: "wallet", change: `${data?.failedOrders ?? 0} failed` }
  ];

  const StatIcon = ({ icon }) => {
    switch (icon) {
      case "clipboard": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/15"><svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>;
      case "users": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15"><svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>;
      case "trending": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15"><svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>;
      case "wallet": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15"><svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 10H18a2 2 0 000 4h4"/></svg></div>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card-outline rounded-2xl bg-surface-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{stat.label}</p>
              <StatIcon icon={stat.icon} />
            </div>
            <p className="mt-3 text-xl font-semibold text-ink sm:text-2xl">{stat.value}</p>
            <p className="mt-1 text-[10px] text-ink-muted">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-outline rounded-2xl bg-surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink sm:text-xl">Revenue Overview</h2>
            <span className="rounded-full border border-accent/15 bg-surface px-3 py-1 text-[10px] text-ink-muted">12-Month Trend</span>
          </div>
          {chartData.length > 0 ? (
            <>
              <div className="mt-6 flex h-32 items-end justify-between gap-1 border-b border-accent/10 pb-4 sm:h-40">
                {chartData.map((d, i) => (
                  <div key={d.month} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-accent/30 transition-all hover:bg-accent"
                      style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface-elevated px-2 py-1 text-[10px] text-ink shadow-lg group-hover:block">
                      GHS {Number(d.revenue).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-ink-muted">
                {chartData.filter((_, i) => i % 2 === 0 || i === chartData.length - 1).map((d) => (
                  <span key={d.month}>{d.month}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 flex h-32 items-center justify-center rounded-2xl border border-dashed border-accent/20 text-sm text-ink-muted sm:h-40">
              Revenue data will appear once orders start flowing in.
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Total Revenue</p>
              <p className="mt-1 text-base font-semibold text-ink sm:text-lg">GHS {Number(data?.revenueTotal ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-accent">↑ across all time</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Pending Orders</p>
              <p className="mt-1 text-base font-semibold text-ink sm:text-lg">{data?.pendingOrders ?? 0}</p>
              <p className="text-[10px] text-yellow-400">awaiting fulfillment</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Failed Orders</p>
              <p className="mt-1 text-base font-semibold text-ink sm:text-lg">{data?.failedOrders ?? 0}</p>
              <p className="text-[10px] text-red-400">requires attention</p>
            </div>
          </div>
        </div>

        <div className="card-outline rounded-2xl bg-surface-card p-5 sm:p-6">
          <h2 className="font-display text-lg text-ink sm:text-xl">Today's Snapshot</h2>
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 sm:h-16 sm:w-16">
              <svg className="h-7 w-7 text-accent sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </div>
            <h3 className="mt-4 font-display text-lg text-ink sm:text-xl">Platform is operational.</h3>
            <p className="mt-2 text-sm text-ink-muted">
              {data?.orders ?? 0} total orders processed across {data?.agents ?? 0} active agents with {data?.subscriptions ?? 0} active subscriptions.
            </p>
          </div>
          <a
            href="/api/admin/reports/orders"
            className="mt-6 block w-full rounded-full bg-accent px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-night mobile-tap"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export report
            </span>
          </a>
        </div>
      </div>

      <div className="card-outline rounded-2xl bg-surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="badge">System pulse</p>
            <h2 className="mt-3 font-display text-lg text-ink sm:text-xl">Operational metrics update in real time.</h2>
          </div>
          <a
            href="/api/admin/reports/orders"
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-night mobile-tap"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export report
          </a>
        </div>
        <p className="mt-6 text-sm text-ink-muted">
          Webhook health, payment verification, and fraud monitoring reflect live Paystack events once transactions flow in.
        </p>
      </div>
    </div>
  );
}
