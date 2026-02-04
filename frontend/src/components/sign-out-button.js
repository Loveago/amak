"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ className = "" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={`rounded-full border border-ink/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:border-ink/40 ${className}`}
    >
      {loading ? "Signing out" : "Sign out"}
    </button>
  );
}
