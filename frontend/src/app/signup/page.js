"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  referralCode: ""
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromQuery = searchParams.get("ref");
  const referralLocked = Boolean(referralFromQuery);

  useEffect(() => {
    try {
      const raw = document.cookie.split("; ").find((c) => c.startsWith("user="));
      if (raw) {
        const user = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("=")));
        if (user?.role === "ADMIN") { router.replace("/admin/dashboard"); return; }
        if (user?.role === "AGENT") { router.replace("/agent/dashboard"); return; }
      }
    } catch (_) {}
  }, [router]);

  useEffect(() => {
    if (referralFromQuery && !form.referralCode) {
      setForm((prev) => ({ ...prev, referralCode: referralFromQuery }));
    }
  }, [referralFromQuery, form.referralCode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Creating your account..." });

    if (!form.referralCode.trim()) {
      setStatus({ type: "error", message: "Referral code is required." });
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        referralCode: form.referralCode.trim()
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error || "Unable to create account");
      }

      setStatus({ type: "success", message: "Account created. Redirecting..." });
      router.push("/agent/dashboard");
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to create account" });
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-10 sm:gap-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass relative overflow-hidden rounded-3xl p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-16 top-6 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 bottom-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
          <p className="badge">Start free trial</p>
          <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
            Launch your agent storefront in minutes.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-muted">
            Create your agent account and unlock the lowest plan free for 30 days. You can activate bundles, accept
            orders, and earn commissions right away.
          </p>
          <div className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2">
            {[
              { title: "Instant setup", detail: "Auto-generated storefront URL and wallet." },
              { title: "30-day starter plan", detail: "Lowest plan free for your first month." },
              { title: "Affiliate rewards", detail: "Invite agents and earn downline commissions." },
              { title: "Fast fulfillment", detail: "Orders flow straight to fulfillment." }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-accent/10 bg-surface-card p-3 text-sm sm:p-4">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-xs text-ink-muted">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Link
              href="/login"
              className="rounded-full border border-accent/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink mobile-tap sm:px-6"
            >
              Back to sign in
            </Link>
            <Link
              href="/store/ama-store"
              className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-night mobile-tap sm:px-6"
            >
              Preview storefront
            </Link>
          </div>
        </section>

        <section className="card-outline flex-1 rounded-3xl bg-surface-card p-6 sm:p-10">
          <h2 className="font-display text-xl text-ink sm:text-2xl">Create agent account</h2>
          <p className="mt-2 text-sm text-ink-muted">Enter your details to start the trial plan.</p>
          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Full name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                placeholder="Ama Konadu"
              />
            </div>
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
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Phone (optional)</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                placeholder="+233 55 000 0000"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Password</label>
              <div className="relative mt-2">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-accent/15 bg-surface px-4 py-3 pr-20 text-sm text-ink focus:border-accent/40 focus:outline-none"
                  placeholder="Create a secure password"
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
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">Referral code (required)</label>
              <input
                type="text"
                name="referralCode"
                required
                value={form.referralCode}
                onChange={handleChange}
                readOnly={referralLocked}
                className="mt-2 w-full rounded-2xl border border-accent/15 bg-surface px-4 py-3 text-sm text-ink focus:border-accent/40 focus:outline-none"
                placeholder="Enter referral code"
              />
              {referralLocked && (
                <p className="mt-2 text-xs text-ink-muted">Referral code applied from your invite link.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full rounded-full bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-night disabled:opacity-60 mobile-tap"
            >
              {status.type === "loading" ? "Creating account" : "Start free trial"}
            </button>
            {status.message && (
              <p className={`text-xs ${status.type === "error" ? "text-red-500" : "text-ink-muted"}`}>{status.message}</p>
            )}
          </form>
          <p className="mt-6 text-xs text-ink-muted">
            By creating an account you agree to ABK's service terms and fulfillment policies.
          </p>
        </section>
      </div>
    </main>
  );
}
