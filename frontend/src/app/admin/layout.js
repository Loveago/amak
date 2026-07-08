import Link from "next/link";
import { requireAdmin } from "../../lib/auth";
import { serverApi } from "../../lib/server-api";
import MobileDrawer from "../../components/mobile-drawer";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reconciled", label: "Reconciled Orders" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/wallets", label: "Wallets" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
  { href: "/admin/wallet-deposits", label: "Wallet Deposits" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/afa-registrations", label: "AFA Registrations" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/api-access", label: "API Access" },
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
            <h1 className="font-display text-2xl text-ink">Welcome back,</h1>
            <h2 className="font-display text-3xl text-ink">Admin Control 🛡️</h2>
            <p className="mt-1 text-sm text-ink-muted">All system metrics, pricing, and payouts in one view.</p>
          </div>
          <div className="rounded-2xl border border-accent/10 bg-surface-card px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Total revenue</p>
            <p className="mt-1 text-2xl font-semibold text-ink">GHS {revenueTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end lg:hidden">
          <MobileDrawer title="Admin menu" buttonLabel="Menu" items={navItems} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="rounded-3xl border border-accent/10 bg-surface-card p-4">
              <div className="mb-4 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-xs font-bold text-accent">
                    AD
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Admin HQ</p>
                    <p className="text-[11px] text-ink-muted">System management</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition hover:bg-accent/10 hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-surface-elevated p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Security</p>
                <p className="mt-2 text-sm font-semibold text-ink">Audit tracking enabled</p>
                <Link
                  href="/admin/logs"
                  className="mt-3 block w-full rounded-full bg-accent px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.15em] text-night"
                >
                  Review audit log
                </Link>
              </div>
            </div>
          </aside>

          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
