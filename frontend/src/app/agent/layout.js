import Link from "next/link";
import { headers } from "next/headers";
import { requireAgent } from "../../lib/auth";
import { serverApi } from "../../lib/server-api";
import MobileDrawer from "../../components/mobile-drawer";

const navItems = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/products", label: "Products" },
  { href: "/agent/orders", label: "Orders" },
  { href: "/agent/wallet", label: "Wallet" },
  { href: "/agent/withdrawals", label: "Withdrawals" },
  { href: "/agent/subscription", label: "Subscription" },
  { href: "/agent/affiliate", label: "Affiliate" },
  { href: "/agent/afa-registration", label: "AFA Registration" }
];

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
  const storefront = storefrontPath ? (baseUrl ? `${baseUrl}${storefrontPath}` : storefrontPath) : "Storefront pending";
  const mobileFooter = storefrontPath ? (
    <div className="rounded-2xl bg-ink px-4 py-4 text-sm text-white">
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Storefront</p>
      <p className="mt-2 font-semibold break-all">{storefront}</p>
      <p className="mt-4 text-xs text-white/70">Share this URL with customers to order bundles.</p>
    </div>
  ) : null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="badge">Agent portal</p>
            <h1 className="mt-3 font-display text-3xl text-ink">AmaBaKinaata Agent Command</h1>
            <p className="text-sm text-ink/60">Manage storefronts, profits, and commissions.</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-right text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Wallet balance</p>
            <p className="mt-1 text-xl font-semibold text-ink">GHS {balance}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end lg:hidden">
          <MobileDrawer title="Agent menu" buttonLabel="Menu" items={navItems} footer={mobileFooter} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block glass rounded-3xl p-5">
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
            <div className="mt-6 rounded-2xl bg-ink px-4 py-4 text-sm text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Storefront</p>
              <p className="mt-2 font-semibold break-all">{storefront}</p>
              <p className="mt-4 text-xs text-white/70">
                Share this URL with customers to let them order bundles directly.
              </p>
            </div>
          </aside>

          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
