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
      className={`flex items-center gap-2 rounded-full border border-accent/15 bg-surface-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:border-accent/30 ${className}`}
    >
      {loading ? "Signing out" : "Sign out"}
    </button>
  );
}
