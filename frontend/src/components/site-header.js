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
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-sand/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-3 text-sm sm:py-4">
        <div className="flex items-center justify-between sm:hidden">
          <Link href="/" className="font-display text-base font-semibold text-ink">
            AMK ENT
          </Link>
          <MobileDrawer title="Menu" buttonLabel="Menu" items={menuItems} footer={menuFooter} />
        </div>

        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <Link href="/" className="font-display text-lg font-semibold text-ink">
            AmaBaKinaata Enterprise
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://whatsapp.com/channel/0029Vb73n7T8F2pCwHAumS0q"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"
            >
              Join WhatsApp
            </a>
            {user?.role !== "ADMIN" && (
              <Link
                href={storefrontHref}
                className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
              >
                Visit storefront
              </Link>
            )}
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  {user.role === "ADMIN" ? "Admin" : "Agent"} dashboard
                </Link>
                <SignOutButton className="sm:w-auto" />
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
                >
                  Sign up
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
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
