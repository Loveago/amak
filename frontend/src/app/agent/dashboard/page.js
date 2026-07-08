import Link from "next/link";
import { requireAgent } from "../../../lib/auth";
import { serverApi } from "../../../lib/server-api";

export default async function AgentDashboardPage() {
  requireAgent("/agent/dashboard");
  let dashboard = null;
  let orders = [];
  let products = [];
  let downlines = [];

  try {
    [dashboard, orders, products, downlines] = await Promise.all([
      serverApi("/agent/dashboard"),
      serverApi("/agent/orders?page=1&limit=10"),
      serverApi("/agent/products"),
      serverApi("/agent/affiliate")
    ]);
  } catch (error) {
    dashboard = null;
    orders = [];
    products = [];
    downlines = [];
  }

  const recentOrders = Array.isArray(orders?.items) ? orders.items : Array.isArray(orders) ? orders : [];

  const activeBundles = products.filter((product) => product.isActive).length;
  const ordersCount = dashboard?.ordersCount ?? recentOrders.length;
  const shareSubject = encodeURIComponent("ABK Agent Report");
  const shareBody = encodeURIComponent(
    `Orders: ${ordersCount}\nWallet balance: GHS ${Number(dashboard?.walletBalanceGhs ?? 0).toFixed(2)}\nActive bundles: ${activeBundles}\nAffiliate downlines: ${downlines.length}`
  );
  const shareHref = `mailto:?subject=${shareSubject}&body=${shareBody}`;

  const stats = [
    { label: "Orders", value: `${ordersCount}`, icon: "clipboard", change: "-- 0% from yesterday" },
    { label: "Wallet balance", value: `GHS ${Number(dashboard?.walletBalanceGhs ?? 0).toFixed(2)}`, icon: "wallet", change: "-- 0% from yesterday" },
    { label: "Active bundles", value: `${activeBundles}`, icon: "zap", change: "↑ 12% from yesterday" },
    { label: "Affiliate downlines", value: `${downlines.length}`, icon: "users", change: "-- 0% from yesterday" }
  ];

  const StatIcon = ({ icon }) => {
    const cls = "h-4 w-4 text-accent";
    switch (icon) {
      case "clipboard": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15"><svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>;
      case "wallet": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15"><svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 10H18a2 2 0 000 4h4"/></svg></div>;
      case "zap": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15"><svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>;
      case "users": return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15"><svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-outline rounded-2xl bg-surface-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{stat.label}</p>
              <StatIcon icon={stat.icon} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 text-[10px] text-ink-muted">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-outline rounded-2xl bg-surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">Performance Overview</h2>
            <span className="rounded-full border border-accent/15 bg-surface px-3 py-1 text-[10px] text-ink-muted">This Month</span>
          </div>
          <div className="mt-6 flex h-40 items-end justify-between gap-1 border-b border-accent/10 pb-4">
            {[20, 35, 28, 45, 38, 60, 52, 70, 65, 80, 75, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-accent/30 transition-all hover:bg-accent" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Revenue</p>
              <p className="mt-1 text-lg font-semibold text-ink">GHS {Number(dashboard?.walletBalanceGhs ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-accent">↑ 18.2%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Profit</p>
              <p className="mt-1 text-lg font-semibold text-ink">GHS {Number(dashboard?.profitGhs ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-accent">↑ 14.7%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Commissions</p>
              <p className="mt-1 text-lg font-semibold text-ink">GHS {Number(dashboard?.commissionsGhs ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-accent">↑ 11.3%</p>
            </div>
          </div>
        </div>

        <div className="card-outline rounded-2xl bg-surface-card p-5 sm:p-6">
          <h2 className="font-display text-xl text-ink">Today&apos;s Snapshot</h2>
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
              <svg className="h-8 w-8 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </div>
            <h3 className="mt-4 font-display text-xl text-ink">You&apos;re trending above target.</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Subscription, product activations, and customer insights update automatically once your data flows in.
            </p>
          </div>
          <a
            href={shareHref}
            className="mt-6 block w-full rounded-full bg-accent px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-night"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Share report
            </span>
          </a>
        </div>
      </div>

      <div className="card-outline rounded-2xl bg-surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl text-ink">Recent Orders</h2>
          <Link href="/agent/orders" className="flex items-center gap-1 text-sm font-semibold text-accent">
            View all orders <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-accent/20 px-4 py-8 text-center text-sm text-ink-muted">
              No orders yet. Share your storefront link to start processing data bundle requests.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-accent/10 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                  <th className="px-3 py-3 text-left font-medium">Order ID</th>
                  <th className="px-3 py-3 text-left font-medium">Customer</th>
                  <th className="px-3 py-3 text-left font-medium">Product</th>
                  <th className="px-3 py-3 text-left font-medium">Amount</th>
                  <th className="px-3 py-3 text-left font-medium">Status</th>
                  <th className="px-3 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-accent/5">
                    <td className="px-3 py-3 font-medium text-ink">#{order.id?.slice(-8) || order.id}</td>
                    <td className="px-3 py-3 text-ink-muted">{order.customerName || "Customer"}</td>
                    <td className="px-3 py-3 text-ink-muted">{order.productName || "Data Bundle"}</td>
                    <td className="px-3 py-3 font-medium text-ink">GHS {Number(order.totalAmountGhs || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        order.status === "COMPLETED" || order.status === "completed"
                          ? "bg-accent/15 text-accent"
                          : order.status === "PENDING" || order.status === "pending"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
