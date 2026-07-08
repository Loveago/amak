import Link from "next/link";
import { requireAdmin } from "../../lib/auth";
import { serverApi } from "../../lib/server-api";
import MobileDrawer from "../../components/mobile-drawer";
import MobileBottomNav from "../../components/mobile-bottom-nav";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/bulk-orders", label: "Bulk Orders" },
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
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10 mobile-content-padding">
        {/* Mobile Header */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Admin Panel</p>
                <p className="text-sm font-semibold text-ink">Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-accent/15 bg-surface-card px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-ink-muted">Revenue</p>
                <p className="text-sm font-bold text-accent">GHS {revenueTotal.toFixed(0)}</p>
              </div>
              <MobileDrawer title="Admin menu" buttonLabel="All" items={navItems} />
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link href="/admin/orders" className="flex flex-col items-center gap-1.5 rounded-2xl border border-accent/10 bg-surface-card p-3 transition active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
                <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">Orders</span>
            </Link>
            <Link href="/admin/agents" className="flex flex-col items-center gap-1.5 rounded-2xl border border-accent/10 bg-surface-card p-3 transition active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
                <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">Agents</span>
            </Link>
            <Link href="/admin/withdrawals" className="flex flex-col items-center gap-1.5 rounded-2xl border border-accent/10 bg-surface-card p-3 transition active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/15">
                <svg className="h-4 w-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">Payouts</span>
            </Link>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h1 className="font-display text-2xl text-ink">Welcome back,</h1>
            <h2 className="font-display text-3xl text-ink">Admin Control</h2>
            <p className="mt-1 text-sm text-ink-muted">All system metrics, pricing, and payouts in one view.</p>
          </div>
          <div className="rounded-2xl border border-accent/10 bg-surface-card px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Total revenue</p>
            <p className="mt-1 text-2xl font-semibold text-ink">GHS {revenueTotal.toFixed(2)}</p>
          </div>
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

          <section className="mt-4 space-y-6 sm:mt-0">{children}</section>
        </div>
      </div>

      <MobileBottomNav role="ADMIN" />
    </main>
  );
}
