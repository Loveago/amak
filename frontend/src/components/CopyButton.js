"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy", className = "", ariaLabel = "Copy text" }) {
  const [status, setStatus] = useState("idle");

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const displayLabel = status === "copied" ? "Copied" : status === "error" ? "Failed" : label;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/60 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <rect x="3" y="3" width="12" height="12" rx="2" />
      </svg>
      {displayLabel}
    </button>
  );
}
