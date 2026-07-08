"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const initialForm = { email: "", password: "" };

export default function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    try {
      const raw = document.cookie.split("; ").find((c) => c.startsWith("user="));
      if (raw) {
        const user = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("=")));
        if (user?.role === "ADMIN") { router.replace(next || "/admin/dashboard"); return; }
        if (user?.role === "AGENT") { router.replace(next || "/agent/dashboard"); return; }
      }
    } catch (_) {}
  }, [router, next]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Signing you in..." });

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Invalid credentials");
      }

      const user = payload?.data;
      const destination = next || (user?.role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard");
      setStatus({ type: "success", message: "Authenticated. Redirecting..." });
      router.push(destination);
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to sign in" });
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-10 sm:gap-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass relative overflow-hidden rounded-3xl p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-24 top-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
          <p className="badge">ABK Enterprise</p>
          <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
            Sign in to your bundle command center.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-muted">
            Manage storefronts, payouts, and subscriptions from one portal. Agents can self-register and start a
            complimentary 30-day starter plan automatically.
          </p>
          <div className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2">
            {[
              { title: "Agent storefront", detail: "Launch in minutes with dynamic pricing." },
              { title: "Instant payouts", detail: "Track balances and request withdrawals." },
              { title: "Affiliate growth", detail: "Earn commissions on downlines." },
              { title: "Admin controls", detail: "Oversee pricing, plans, and audits." }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-accent/10 bg-surface-card p-3 text-sm sm:p-4">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-xs text-ink-muted">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-night mobile-tap sm:px-6"
            >
              Create agent account
            </Link>
            <Link
              href="/"
              className="rounded-full border border-accent/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink mobile-tap sm:px-6"
            >
              Back to landing
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink-muted">
            Admin accounts are provisioned by the HQ team. Need access? Contact support.
          </p>
        </section>

        <section className="card-outline flex-1 rounded-3xl bg-surface-card p-6 sm:p-10">
          <h2 className="font-display text-xl text-ink sm:text-2xl">Welcome back</h2>
          <p className="mt-2 text-sm text-ink-muted">Use your email and password to continue.</p>
          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Password</label>
              <div className="relative mt-2">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-accent/15 bg-surface px-4 py-3 pr-20 text-sm text-ink focus:border-accent/40 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((prev) => !prev)}
                  className="absolute inset-y-0 right-3 my-auto rounded-full px-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted mobile-tap"
                  aria-pressed={passwordVisible}
                >
                  {passwordVisible ? "Hide" : "View"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full rounded-full bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-night disabled:opacity-60 mobile-tap"
            >
              {status.type === "loading" ? "Signing in" : "Access portal"}
            </button>
            {status.message && (
              <p className={`text-xs ${status.type === "error" ? "text-red-500" : "text-ink-muted"}`}>{status.message}</p>
            )}
          </form>
          <div className="mt-8 border-t border-accent/10 pt-6 text-xs text-ink-muted">
            <p>
              New agent?{" "}
              <Link href="/signup" className="font-semibold text-accent">
                Start your free trial →
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
