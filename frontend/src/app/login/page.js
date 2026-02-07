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
      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass relative overflow-hidden rounded-3xl p-10">
          <div className="pointer-events-none absolute -right-24 top-10 h-48 w-48 rounded-full bg-aurora/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-8 h-32 w-32 rounded-full bg-sunset/30 blur-2xl" />
          <p className="badge">AmaBaKinaata Enterprise</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">
            Sign in to your bundle command center.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink/70">
            Manage storefronts, payouts, and subscriptions from one portal. Agents can self-register and start a
            complimentary 30-day starter plan automatically.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { title: "Agent storefront", detail: "Launch in minutes with dynamic pricing." },
              { title: "Instant payouts", detail: "Track balances and request withdrawals." },
              { title: "Affiliate growth", detail: "Earn commissions on downlines." },
              { title: "Admin controls", detail: "Oversee pricing, plans, and audits." }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-xs text-ink/60">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              Create agent account
            </Link>
            <Link
              href="/"
              className="rounded-full border border-ink/20 bg-white/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              Back to landing
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink/60">
            Admin accounts are provisioned by the HQ team. Need access? Contact support.
          </p>
        </section>

        <section className="card-outline flex-1 rounded-3xl bg-white/95 p-10 shadow-xl">
          <h2 className="font-display text-2xl text-ink">Welcome back</h2>
          <p className="mt-2 text-sm text-ink/60">Use your email and password to continue.</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink/60">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink/60">Password</label>
              <div className="relative mt-2">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 pr-20 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((prev) => !prev)}
                  className="absolute inset-y-0 right-3 my-auto rounded-full border border-transparent bg-white/0 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink/60"
                  aria-pressed={passwordVisible}
                >
                  {passwordVisible ? "Hide" : "View"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-60"
            >
              {status.type === "loading" ? "Signing in" : "Access portal"}
            </button>
            {status.message && (
              <p className={`text-xs ${status.type === "error" ? "text-red-600" : "text-ink/70"}`}>{status.message}</p>
            )}
          </form>
          <div className="mt-8 border-t border-ink/10 pt-6 text-xs text-ink/60">
            <p>
              New agent?{" "}
              <Link href="/signup" className="font-semibold text-ink">
                Start your free trial →
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
