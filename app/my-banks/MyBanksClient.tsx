"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BankRow {
  id: string;
  title: string;
  description: string | null;
  defaultMode: string;
  examDurationMin: number | null;
  questionCount: number;
  lastTakenAt: string | null;
  updatedAt: string;
}

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function MyBanksClient() {
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user-banks");
      if (res.ok) setBanks(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function deleteBank(id: string) {
    if (!window.confirm("Permanently delete this bank and all its questions? This can’t be undone.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/user-banks/${id}`, { method: "DELETE" });
      if (res.ok) setBanks((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Bring your own material</p>
          <h1 className="type-display text-2xl text-ink sm:text-3xl">My banks</h1>
          <p className="text-sm text-pencil">
            Turn your notes, a chapter, or any document into a private question bank or timed mock exam.
          </p>
        </div>
        <Button asChild className="bg-ballpoint text-paper hover:bg-ballpoint/90">
          <Link href="/my-banks/new">+ Create new</Link>
        </Button>
      </div>

      {loading ? (
        <div className="paper-sheet p-8 text-center text-sm text-pencil">Loading…</div>
      ) : banks.length === 0 ? (
        <div className="paper-sheet space-y-3 p-8 text-center">
          <p className="text-sm text-ink">You haven’t made any banks yet.</p>
          <p className="text-sm text-pencil">
            Create one from your own study material — we’ll give you a prompt to run in your AI tool, and you
            paste the result back here.
          </p>
          <Button asChild className="bg-ballpoint text-paper hover:bg-ballpoint/90">
            <Link href="/my-banks/new">Create your first bank</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map((b) => (
            <div key={b.id} className="paper-sheet p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="type-display truncate text-lg text-ink">{b.title}</h2>
                  {b.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-pencil">{b.description}</p>
                  )}
                  <p className="type-data mt-1 text-xs text-pencil">
                    {b.questionCount} question{b.questionCount === 1 ? "" : "s"}
                    {" · updated "}
                    {when(b.updatedAt)}
                    {b.lastTakenAt ? ` · last taken ${when(b.lastTakenAt)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteBank(b.id)}
                  disabled={busy === b.id}
                  className="type-data shrink-0 text-xs text-redpen hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/my-banks/${b.id}?mode=bank`}>Practice</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/my-banks/${b.id}?mode=exam`}>Take as exam</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/my-banks/${b.id}/edit`}>Edit</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={`/api/user-banks/${b.id}/export`} download>
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
