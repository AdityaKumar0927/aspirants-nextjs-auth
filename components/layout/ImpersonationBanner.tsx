"use client";

import { useEffect, useState } from "react";

/**
 * A persistent banner shown whenever the current request is an admin
 * impersonation overlay. It calls the impersonation status endpoint on mount;
 * when active it pins a high-contrast bar to the bottom of the screen with a
 * Stop button. Renders nothing for normal sessions, so it's safe to mount in the
 * shared layout for everyone.
 */
type Status = { impersonating: boolean; target?: { email: string | null; name: string | null } };

export function ImpersonationBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/impersonate")
      .then((r) => (r.ok ? r.json() : { impersonating: false }))
      .then((d) => alive && setStatus(d))
      .catch(() => alive && setStatus({ impersonating: false }));
    return () => {
      alive = false;
    };
  }, []);

  if (!status?.impersonating) return null;

  const who = status.target?.email || status.target?.name || "a user";

  const stop = async () => {
    setStopping(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
    } finally {
      window.location.href = "/administrator/settings";
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex items-center justify-center gap-4 bg-amber-500 px-4 py-2 text-sm text-amber-950 shadow-lg">
      <span className="font-semibold">Impersonating {who}</span>
      <span className="hidden sm:inline opacity-80">Admin actions are blocked while impersonating.</span>
      <button
        type="button"
        onClick={stop}
        disabled={stopping}
        className="rounded bg-amber-950 px-3 py-1 text-xs font-medium text-amber-50 hover:bg-amber-900 disabled:opacity-60"
      >
        {stopping ? "Stopping…" : "Stop impersonating"}
      </button>
    </div>
  );
}
