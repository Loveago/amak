"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-sand/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm">
        <Link href="/" className="font-display text-lg font-semibold text-ink">
          AmaBaKinaata Enterprise
        </Link>
        <div className="flex flex-wrap items-center gap-3">
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
              <SignOutButton />
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
    </header>
  );
}
