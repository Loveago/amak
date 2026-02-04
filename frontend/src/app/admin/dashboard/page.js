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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-outline rounded-3xl bg-white/90 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="badge">System pulse</p>
            <h2 className="mt-3 font-display text-2xl text-ink">Operational metrics update in real time.</h2>
          </div>
          <a
            href="/api/admin/reports/orders"
            className="rounded-full bg-aurora px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Export report
          </a>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Webhook health, payment verification, and fraud monitoring reflect live Paystack events once transactions flow in.
        </p>
      </div>
    </div>
  );
}
