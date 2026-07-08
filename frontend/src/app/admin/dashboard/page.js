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

  const stats = [
    { label: "Total orders", value: `${data?.orders ?? 0}` },
    { label: "Active agents", value: `${data?.agents ?? 0}` },
    { label: "Subscriptions", value: `${data?.subscriptions ?? 0}` },
    { label: "AFA registrations", value: `${data?.afaRegistrations ?? 0}` },
    { label: "Wallet payouts", value: `GHS ${Number(data?.walletPayouts ?? 0).toFixed(2)}` }
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-outline rounded-2xl bg-surface-card p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{stat.value}</p>
          </div>
        ))}
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
