"use client";

import { useEffect, useState } from "react";

const VARIANT_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-ink/10 bg-white text-ink"
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
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3">
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
