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
      serverApi("/agent/orders"),
      serverApi("/agent/products"),
      serverApi("/agent/affiliate")
    ]);
  } catch (error) {
    dashboard = null;
    orders = [];
    products = [];
    downlines = [];
  }

  const activeBundles = products.filter((product) => product.isActive).length;
  const ordersCount = dashboard?.ordersCount ?? orders.length;
  const shareSubject = encodeURIComponent("AmaBaKinaata Agent Report");
  const shareBody = encodeURIComponent(
    `Orders: ${ordersCount}\nWallet balance: GHS ${Number(dashboard?.walletBalanceGhs ?? 0).toFixed(2)}\nActive bundles: ${activeBundles}\nAffiliate downlines: ${downlines.length}`
  );
  const shareHref = `mailto:?subject=${shareSubject}&body=${shareBody}`;

  const stats = [
    { label: "Orders", value: `${ordersCount}` },
    {
      label: "Wallet balance",
      value: `GHS ${Number(dashboard?.walletBalanceGhs ?? 0).toFixed(2)}`
    },
    { label: "Active bundles", value: `${activeBundles}` },
    { label: "Affiliate downlines", value: `${downlines.length}` }
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-outline rounded-3xl bg-white/90 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="badge">Today&apos;s snapshot</p>
            <h2 className="mt-3 font-display text-xl text-ink sm:text-2xl">You&apos;re trending above target.</h2>
          </div>
          <a
            href={shareHref}
            className="w-full rounded-full bg-aurora px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white sm:w-auto"
          >
            Share report
          </a>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Subscription, product activations, and customer insights update automatically once your data flows in.
        </p>
      </div>

      <div className="card-outline rounded-3xl bg-white/90 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl text-ink">Recent orders</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-ink/60">Updated in real-time</span>
        </div>
        <div className="mt-6 space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-6 text-center text-sm text-ink/60">
              No orders yet. Share your storefront link to start processing data bundle requests.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-ink/60">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">GHS {Number(order.totalAmountGhs || 0).toFixed(2)}</p>
                  <p className="text-xs text-ink/60">{order.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
