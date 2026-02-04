import Link from "next/link";
import { requireAdmin } from "../../lib/auth";
import { serverApi } from "../../lib/server-api";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/wallets", label: "Wallets" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/afa-registrations", label: "AFA Registrations" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/logs", label: "Logs" }
];

export default async function AdminLayout({ children }) {
  requireAdmin("/admin/dashboard");
  let revenueTotal = 0;
  try {
    const dashboard = await serverApi("/admin/dashboard");
    revenueTotal = Number(dashboard?.revenueTotal || 0);
  } catch (error) {
    revenueTotal = 0;
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="badge">Admin control</p>
            <h1 className="mt-3 font-display text-3xl text-ink">AmaBaKinaata HQ</h1>
            <p className="text-sm text-ink/60">All system metrics, pricing, and payouts in one view.</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-right text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Total revenue</p>
            <p className="mt-1 text-xl font-semibold text-ink">GHS {revenueTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="glass rounded-3xl p-5">
            <div className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
                >
                  {item.label}
                  <span className="text-xs text-ink/40">↗</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-night px-4 py-4 text-sm text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Security</p>
              <p className="mt-2 font-semibold">Audit tracking enabled</p>
              <Link
                href="/admin/logs"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Review audit log
              </Link>
            </div>
          </aside>

          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
