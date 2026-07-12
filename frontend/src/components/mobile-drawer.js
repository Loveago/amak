"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export default function MobileDrawer({ title, buttonLabel = "Menu", items = [], footer = null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setAnimating(true);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setAnimating(false);
    closeTimerRef.current = setTimeout(() => setOpen(false), 300);
  }, []);

  // Guard against removeChild errors when component unmounts during portal lifecycle
  const portalContainer = mounted ? document.body : null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mobile-menu-trigger group relative flex items-center gap-2.5 rounded-2xl border border-accent/20 bg-surface-card px-4 py-2.5"
        aria-label="Open menu"
      >
        <div className="flex flex-col gap-[4px]">
          <span className="block h-[2px] w-4 rounded-full bg-accent transition-transform group-hover:translate-x-0.5" />
          <span className="block h-[2px] w-3 rounded-full bg-accent/60 transition-transform group-hover:translate-x-1" />
          <span className="block h-[2px] w-4 rounded-full bg-accent transition-transform group-hover:translate-x-0.5" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{buttonLabel}</span>
      </button>

      {open && portalContainer
        ? createPortal(
            <div className={`fixed inset-0 z-[100] mobile-drawer-root ${animating ? "drawer-open" : "drawer-closing"}`}>
              <button
                type="button"
                aria-label="Close menu"
                className="mobile-drawer-backdrop absolute inset-0"
                onClick={handleClose}
              />
              <div className="mobile-drawer-panel absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px] border-t border-accent/15 bg-surface-card pb-8 shadow-2xl">
                <div className="sticky top-0 z-10 flex flex-col items-center bg-surface-card pb-3 pt-3">
                  <div className="h-1 w-10 rounded-full bg-ink-muted/30" />
                </div>

                <div className="px-5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
                        <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="text-[10px] text-ink-muted">{items.length} options available</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/10 bg-surface-elevated text-ink-muted transition active:scale-90"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <nav className="mt-5 grid grid-cols-2 gap-2.5">
                    {items.map((item, index) => {
                      const cardClass = `mobile-nav-card flex flex-col items-start gap-2 rounded-2xl border border-accent/10 bg-surface-elevated p-4 text-sm font-medium text-ink transition-all active:scale-[0.97]`;
                      const delay = { animationDelay: `${index * 50}ms` };
                      if (item.external) {
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            onClick={handleClose}
                            className={cardClass}
                            style={delay}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                              <svg className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                            </div>
                            <span className="text-xs leading-tight">{item.label}</span>
                          </a>
                        );
                      }
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleClose}
                          className={cardClass}
                          style={delay}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                            <svg className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </div>
                          <span className="text-xs leading-tight">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  {footer ? (
                    <div className="mt-5 rounded-2xl border border-accent/10 bg-surface-elevated p-4">
                      {footer}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            portalContainer
          )
        : null}
    </div>
  );
}
