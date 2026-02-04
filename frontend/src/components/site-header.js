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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <Link href="/" className="font-display text-base font-semibold text-ink sm:text-lg">
          AmaBaKinaata Enterprise
        </Link>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <a
            href="https://whatsapp.com/channel/0029Vb73n7T8F2pCwHAumS0q"
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 sm:w-auto sm:px-4 sm:text-xs"
          >
            Join WhatsApp
          </a>
          {user?.role !== "ADMIN" && (
            <Link
              href={storefrontHref}
              className="w-full rounded-full border border-ink/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink sm:w-auto sm:px-4 sm:text-xs"
            >
              Visit storefront
            </Link>
          )}
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="w-full rounded-full bg-ink px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white sm:w-auto sm:px-4 sm:text-xs"
              >
                {user.role === "ADMIN" ? "Admin" : "Agent"} dashboard
              </Link>
              <SignOutButton className="w-full sm:w-auto" />
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink sm:w-auto sm:px-4 sm:text-xs"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="w-full rounded-full bg-ink px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white sm:w-auto sm:px-4 sm:text-xs"
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
