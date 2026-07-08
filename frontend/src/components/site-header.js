"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileDrawer from "./mobile-drawer";
import { SignOutButton } from "./sign-out-button";

export default function SiteHeader({ user, dashboardHref }) {
  const pathname = usePathname();
  const storefrontHref = user?.slug ? `/store/${user.slug}` : "/store/ama-store";
  if (
    pathname?.startsWith("/store") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/receipt")
  ) {
    return null;
  }

  const menuItems = [
    {
      label: "Join WhatsApp",
      href: "https://whatsapp.com/channel/0029Vb73n7T8F2pCwHAumS0q",
      external: true
    },
    ...(user?.role !== "ADMIN" ? [{ label: "Visit storefront", href: storefrontHref }] : []),
    ...(user
      ? [{ label: `${user.role === "ADMIN" ? "Admin" : "Agent"} dashboard`, href: dashboardHref }]
      : [
          { label: "Sign up", href: "/signup" },
          { label: "Sign in", href: "/login" }
        ])
  ];
  const menuFooter = user ? <SignOutButton className="w-full" /> : null;

  return (
    <header className="sticky top-0 z-40 border-b border-accent/10 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-6 py-3 text-sm sm:py-4">
        <div className="flex items-center justify-between sm:hidden">
          <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-night">A</span>
            ABK ENT
          </Link>
          <MobileDrawer title="Menu" buttonLabel="Menu" items={menuItems} footer={menuFooter} />
        </div>

        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-night">A</span>
            ABK Enterprise
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://whatsapp.com/channel/0029Vb73n7T8F2pCwHAumS0q"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.5A11.87 11.87 0 0012.05 0C5.45 0 .1 5.35.1 11.95c0 2.1.55 4.15 1.6 5.95L0 24l6.3-1.65A11.87 11.87 0 0012.05 24c6.6 0 11.95-5.35 11.95-11.95 0-3.2-1.25-6.2-3.48-8.55z"/></svg>
              Join WhatsApp
            </a>
            {user?.role !== "ADMIN" && (
              <Link
                href={storefrontHref}
                className="flex items-center gap-2 rounded-full border border-accent/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                Visit storefront
              </Link>
            )}
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                  {user.role === "ADMIN" ? "Admin" : "Agent"} dashboard
                </Link>
                <SignOutButton className="sm:w-auto" />
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-full border border-accent/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
