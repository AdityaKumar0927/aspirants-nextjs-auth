"use client";

import { useEffect, useState } from "react";

/**
 * Renders the active announcement banners and remembers per-banner dismissals in
 * localStorage (by id). The message is plain text — never dangerouslySetInnerHTML.
 */
export type BannerItem = {
  id: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  dismissible: boolean;
};

const STYLES: Record<BannerItem["type"], string> = {
  INFO: "bg-blue-600 text-white",
  SUCCESS: "bg-emerald-600 text-white",
  WARNING: "bg-amber-500 text-amber-950",
  CRITICAL: "bg-red-600 text-white",
};

const STORAGE_KEY = "dismissed-announcements";

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function AnnouncementBannerClient({ items }: { items: BannerItem[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
    setReady(true);
  }, []);

  const dismiss = (id: string) => {
    const next = Array.from(new Set([...readDismissed(), id]));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setDismissed(next);
  };

  // Avoid a hydration flash: render nothing until we've read localStorage.
  if (!ready) return null;
  const visible = items.filter((i) => !dismissed.includes(i.id));
  if (!visible.length) return null;

  return (
    <div className="relative z-[60] w-full">
      {visible.map((item) => (
        <div key={item.id} className={`flex items-center justify-center gap-3 px-4 py-2 text-sm ${STYLES[item.type]}`}>
          <p className="text-center font-medium">{item.message}</p>
          {item.dismissible && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded px-1.5 text-base leading-none opacity-80 hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
