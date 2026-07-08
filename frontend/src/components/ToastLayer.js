"use client";

import { useEffect, useState } from "react";

const VARIANT_STYLES = {
  success: "border-accent/20 bg-accent/10 text-accent",
  warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  error: "border-red-500/20 bg-red-500/50/10 text-red-400",
  info: "border-accent/10 bg-surface-card text-ink"
};

export default function ToastLayer({ items = [], duration = 6000 }) {
  const [queue, setQueue] = useState(() => normalizeItems(items));

  useEffect(() => {
    setQueue(normalizeItems(items));
  }, [items]);

  useEffect(() => {
    if (!queue.length) return undefined;
    const timers = queue.map((item) =>
      setTimeout(() => {
        setQueue((prev) => prev.filter((toast) => toast._id !== item._id));
      }, item.duration || duration)
    );
    return () => timers.forEach(clearTimeout);
  }, [queue, duration]);

  if (!queue.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3 mobile-toast-container">
      {queue.map((item) => {
        const palette = VARIANT_STYLES[item.variant] || VARIANT_STYLES.info;
        return (
          <div
            key={item._id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-2xl ${palette}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {item.title && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-current/70">
                    {item.title}
                  </p>
                )}
                <p className="mt-1 text-sm leading-snug">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setQueue((prev) => prev.filter((toast) => toast._id !== item._id))}
                className="rounded-full border border-current/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-current/60"
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function normalizeItems(items) {
  return (items || [])
    .filter((item) => Boolean(item?.message))
    .map((item, index) => ({ ...item, _id: item.id || `${item.variant || "info"}-${index}` }));
}
