"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileDrawer({ title, buttonLabel = "Menu", items = [], footer = null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs overflow-y-auto bg-white/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60"
              >
                Close
              </button>
            </div>
            <nav className="mt-5 space-y-3">
              {items.map((item) => {
                const className = "flex items-center justify-between rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm font-semibold text-ink";
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setOpen(false)}
                      className={className}
                    >
                      {item.label}
                      <span className="text-xs text-ink/40">↗</span>
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={className}
                  >
                    {item.label}
                    <span className="text-xs text-ink/40">↗</span>
                  </Link>
                );
              })}
            </nav>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}
