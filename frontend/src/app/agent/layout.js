import Link from "next/link";
import { headers } from "next/headers";
import { requireAgent } from "../../lib/auth";
import { serverApi } from "../../lib/server-api";
import MobileDrawer from "../../components/mobile-drawer";
import MobileBottomNav from "../../components/mobile-bottom-nav";
import CopyButton from "../../components/CopyButton";

const navItems = [
  { href: "/agent/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/agent/products", label: "Products", icon: "box" },
  { href: "/agent/orders", label: "Orders", icon: "clipboard" },
  { href: "/agent/wallet", label: "Wallet", icon: "wallet" },
  { href: "/agent/withdrawals", label: "Withdrawals", icon: "arrow-down" },
  { href: "/agent/subscription", label: "Subscription", icon: "star" },
  { href: "/agent/settings", label: "Settings", icon: "settings" },
  { href: "/agent/affiliate-pricing", label: "Affiliate Pricing", icon: "tag" },
  { href: "/agent/affiliate", label: "Affiliate", icon: "users" },
  { href: "/agent/afa-registration", label: "AFA Registration", icon: "user-plus" },
  { href: "/agent/api", label: "API", icon: "code" },
  { href: "/agent/direct-order", label: "Direct Order", icon: "send" }
];

const NavIcon = ({ icon }) => {
  const cls = "h-4 w-4";
  switch (icon) {
    case "grid": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case "box": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
    case "clipboard": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>;
    case "wallet": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 10H18a2 2 0 000 4h4"/></svg>;
    case "arrow-down": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case "star": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "settings": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15 1.65 1.65 0 003.17 14H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68 1.65 1.65 0 0010 3.17V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case "tag": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "users": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
    case "user-plus": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
    case "code": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case "send": return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    default: return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
  }
};

export default async function AgentLayout({ children }) {
  const user = requireAgent();
  let wallet = null;
  try {
    wallet = await serverApi("/agent/wallet");
  } catch (error) {
    wallet = null;
  }

  const balance = Number(wallet?.balanceGhs || 0).toFixed(2);
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "https";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "");
  const storefrontPath = user.slug ? `/store/${user.slug}` : "";
  const hasStorefrontLink = Boolean(storefrontPath);
  const storefront = hasStorefrontLink
    ? baseUrl
      ? `${baseUrl}${storefrontPath}`
      : storefrontPath
    : "Storefront pending";
  const mobileFooter = hasStorefrontLink ? (
    <div className="rounded-2xl bg-surface-elevated px-4 py-4 text-sm text-ink">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Storefront</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="font-semibold break-all text-accent">{storefront}</p>
        <CopyButton
          value={storefront}
          ariaLabel="Copy storefront link"
          className="bg-accent/10 text-accent border-accent/30"
        />
      </div>
      <p className="mt-4 text-xs text-ink-muted">Share this URL with customers to order bundles.</p>
    </div>
  ) : null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10 mobile-content-padding">
        {/* Mobile Header - Compact & Beautiful */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
                <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Welcome back</p>
                <p className="text-sm font-semibold text-ink">ABK Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-accent/15 bg-surface-card px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-ink-muted">Balance</p>
                <p className="text-sm font-bold text-accent">GHS {balance}</p>
              </div>
              <MobileDrawer title="Agent menu" buttonLabel="All" items={navItems} footer={mobileFooter} />
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link href="/agent/direct-order" className="flex flex-col items-center gap-1.5 rounded-2xl border border-accent/10 bg-surface-card p-3 transition active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
                <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">Quick Send</span>
            </Link>
            <Link href="/agent/withdrawals" className="flex flex-col items-center gap-1.5 rounded-2xl border border-accent/10 bg-surface-card p-3 transition active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
                <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">Withdraw</span>
            </Link>
            <Link href="/agent/affiliate" className="flex flex-col items-center gap-1.5 rounded-2xl border border-accent/10 bg-surface-card p-3 transition active:scale-95">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15">
                <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <span className="text-[10px] font-medium text-ink-muted">Referrals</span>
            </Link>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h1 className="font-display text-2xl text-ink">Welcome back,</h1>
            <h2 className="font-display text-3xl text-ink">ABK Agent</h2>
            <p className="mt-1 text-sm text-ink-muted">Here&apos;s what&apos;s happening with your business today.</p>
          </div>
          <div className="rounded-2xl border border-accent/10 bg-surface-card px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Wallet balance</p>
            <p className="mt-1 text-2xl font-semibold text-ink">GHS {balance}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="rounded-3xl border border-accent/10 bg-surface-card p-4">
              <div className="mb-4 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-xs font-bold text-accent">
                    AB
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">ABK Agent HQ</p>
                    <p className="text-[11px] text-ink-muted">Manage storefronts, profits, and commissions.</p>
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
                    <NavIcon icon={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-surface-elevated p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <p className="text-sm font-semibold text-ink">Grow More, Earn More</p>
                </div>
                <p className="mt-2 text-xs text-ink-muted">Unlock premium features and boost your earnings.</p>
                <Link
                  href="/agent/subscription"
                  className="mt-3 block w-full rounded-full bg-accent px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.15em] text-night"
                >
                  Upgrade now
                </Link>
              </div>
            </div>
          </aside>

          <section className="mt-4 space-y-6 sm:mt-0">{children}</section>
        </div>
      </div>

      <MobileBottomNav role="AGENT" />
    </main>
  );
}
