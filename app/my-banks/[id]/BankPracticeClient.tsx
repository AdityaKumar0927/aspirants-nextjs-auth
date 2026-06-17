"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Bank } from "./types";
import BankPractice from "./BankPractice";
import BankExam from "./BankExam";

export default function BankPracticeClient({
  bankId,
  initialMode,
  userName,
}: {
  bankId: string;
  initialMode: "BANK" | "EXAM" | null;
  userName: string;
}) {
  const [bank, setBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<"BANK" | "EXAM">(initialMode ?? "BANK");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/user-banks/${bankId}`);
        if (!alive) return;
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          const data: Bank = await res.json();
          setBank(data);
          if (!initialMode) setMode(data.defaultMode === "EXAM" ? "EXAM" : "BANK");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bankId, initialMode]);

  if (loading) {
    return <div className="paper-sheet w-full max-w-3xl p-8 text-center text-sm text-pencil">Loading…</div>;
  }
  if (notFound || !bank) {
    return (
      <div className="paper-sheet w-full max-w-md space-y-3 p-8 text-center">
        <p className="text-sm text-ink">This bank doesn’t exist or isn’t yours.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/my-banks">← Back to my banks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Bank control bar — aligned to the Question Bank's max width */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/my-banks" className="type-data text-xs text-pencil hover:text-ink">
          ← My banks
        </Link>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-rule p-0.5">
            <button
              type="button"
              onClick={() => setMode("BANK")}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                mode === "BANK" ? "bg-ballpoint text-paper" : "text-pencil hover:text-ink"
              }`}
            >
              Practice
            </button>
            <button
              type="button"
              onClick={() => setMode("EXAM")}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                mode === "EXAM" ? "bg-ballpoint text-paper" : "text-pencil hover:text-ink"
              }`}
            >
              Exam
            </button>
          </div>
          <Link href={`/my-banks/${bank.id}/edit`} className="type-data text-xs text-ballpoint hover:underline">
            Edit
          </Link>
          <a
            href={`/api/user-banks/${bank.id}/export`}
            download
            className="type-data text-xs text-pencil hover:text-ink hover:underline"
          >
            Download
          </a>
        </div>
      </div>

      {mode === "BANK" ? (
        <BankPractice bank={bank} />
      ) : (
        <BankExam bank={bank} userName={userName} />
      )}
    </div>
  );
}
