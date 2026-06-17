"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Md, SectionHead, AttemptBox, Calibrate, SelfScore } from "./primitives";
import type { KRevisionBank, KRevisionQuestion } from "@/lib/keystone/schema";
import {
  loadRevisionState,
  saveRevisionState,
  clearRevisionState,
  type KRevisionState,
} from "@/lib/keystone/storage";

/** One practice question: predict → produce → reveal → self-score. */
function QuestionCard({
  q,
  onComplete,
}: {
  q: KRevisionQuestion;
  onComplete: (score: 0 | 1 | 2, predicted: number | null) => void;
}) {
  const [predicted, setPredicted] = useState<number | null>(null);
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [scored, setScored] = useState<number | null>(null);

  return (
    <div className="paper-sheet space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="type-data rounded border border-st-review/30 bg-st-review/10 px-1.5 py-0.5 text-[10px] uppercase text-st-review">
          {q.kind}
        </span>
        {q.topic && <span className="type-data text-[11px] text-pencil">{q.topic}</span>}
        {q.difficulty && <span className="type-data text-[11px] text-pencil">· {q.difficulty}</span>}
      </div>

      <Md text={q.question} />

      {!revealed ? (
        <div className="space-y-3">
          {predicted === null && (
            <div className="rounded-md border border-rule bg-secondary/20 p-3">
              <Calibrate value={predicted} onChange={setPredicted} />
            </div>
          )}
          <AttemptBox value={attempt} onChange={setAttempt} placeholder="Produce your answer — recalling beats re-reading." />
          <Button
            size="sm"
            onClick={() => setRevealed(true)}
            disabled={attempt.trim().length < 1 || predicted === null}
            className="bg-ballpoint text-paper hover:bg-ballpoint/90"
          >
            Check my answer
          </Button>
          {predicted === null && attempt.trim().length >= 1 && (
            <p className="type-data text-[11px] text-pencil">Predict your confidence above first.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {attempt.trim() && (
            <div className="rounded-md border border-rule bg-secondary/20 p-3">
              <p className="type-data text-[11px] text-pencil">Your answer</p>
              <p className="whitespace-pre-wrap text-sm text-pencil">{attempt}</p>
            </div>
          )}
          <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
            <p className="type-data text-[11px] text-st-answered">Model answer</p>
            <Md text={q.modelAnswer || "—"} />
          </div>
          <SelfScore
            rubric={q.rubric}
            scored={scored}
            onScore={(n) => {
              setScored(n);
              onComplete(n, predicted);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function RevisionPlayer({
  bank,
  onRestart,
}: {
  bank: KRevisionBank;
  onRestart: () => void;
}) {
  const [mastery, setMastery] = useState<Record<string, number>>({});
  const [calibration, setCalibration] = useState<{ predicted: number; outcome: number }[]>([]);
  const [lastAnswered, setLastAnswered] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Resume mastery for this bank.
  useEffect(() => {
    const st = loadRevisionState(bank.title);
    if (st) {
      setMastery(st.mastery);
      setCalibration(st.calibration);
    }
    setHydrated(true);
  }, [bank.title]);

  // Active = not-yet-mastered, weakest first, lightly interleaved by topic.
  const ordered = useMemo(() => {
    const active = bank.questions.filter((q) => (mastery[q.id] ?? -1) < 2);
    active.sort((a, b) => (mastery[a.id] ?? -1) - (mastery[b.id] ?? -1));
    const out: KRevisionQuestion[] = [];
    const pool = [...active];
    let lastTopic: string | null = null;
    while (pool.length) {
      let idx = pool.findIndex((q) => (q.topic ?? "") !== lastTopic);
      if (idx === -1) idx = 0;
      const [q] = pool.splice(idx, 1);
      out.push(q);
      lastTopic = q.topic ?? "";
    }
    return out;
  }, [bank.questions, mastery]);

  const current = ordered.find((q) => q.id !== lastAnswered) ?? ordered[0] ?? null;
  const masteredCount = bank.questions.filter((q) => mastery[q.id] === 2).length;
  const total = bank.questions.length;
  const pct = Math.round((masteredCount / Math.max(1, total)) * 100);

  function persist(nextMastery: Record<string, number>, nextCal: typeof calibration) {
    const st: KRevisionState = { bankTitle: bank.title, mastery: nextMastery, calibration: nextCal, updatedAt: Date.now() };
    saveRevisionState(st);
  }

  function onComplete(qid: string, score: 0 | 1 | 2, predicted: number | null) {
    const nextMastery = { ...mastery, [qid]: score };
    const nextCal = predicted !== null ? [...calibration, { predicted, outcome: score }] : calibration;
    setMastery(nextMastery);
    setCalibration(nextCal);
    setLastAnswered(qid);
    persist(nextMastery, nextCal);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const avgGap = calibration.length
    ? calibration.reduce((acc, r) => acc + Math.abs(r.predicted / 5 - r.outcome / 2), 0) / calibration.length
    : 0;
  const calPct = Math.round((1 - avgGap) * 100);

  if (!hydrated) return null;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="type-display text-2xl text-ink">{bank.title}</h1>
            {bank.subject && <p className="type-data text-xs text-pencil">{bank.subject} · revision</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { clearRevisionState(); onRestart(); }} className="text-pencil">
            Start over
          </Button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule/40">
          <div className="h-full rounded-full bg-st-answered transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="type-data text-[11px] text-pencil">
          {masteredCount}/{total} mastered{calibration.length > 0 ? ` · calibration ${calPct}% aligned` : ""}
        </p>
      </div>

      {current ? (
        <>
          <SectionHead kicker="Practice testing" title="Recall, then check" />
          <p className="type-data text-[11px] text-pencil">
            Weak and overconfident items come back more often, and anything you miss returns until it sticks.
          </p>
          <QuestionCard key={current.id} q={current} onComplete={(score, predicted) => onComplete(current.id, score, predicted)} />
        </>
      ) : (
        <div className="paper-sheet space-y-4 p-5">
          <SectionHead kicker="Nice work" title="You've mastered this set" />
          <p className="text-sm text-pencil">
            Every question reached “got it”. Come back tomorrow and a day or two after that — spaced return is what makes
            it survive to the exam.
          </p>
          {calibration.length > 0 && (
            <div className="rounded-md border border-rule bg-secondary/20 p-3">
              <p className="type-data text-[11px] text-pencil">Calibration — how well your confidence matched your results</p>
              <p className="text-sm text-ink">{calPct}% aligned across {calibration.length} checks.</p>
            </div>
          )}
          <p className="type-data text-[11px] text-pencil">
            Want more questions? Re-run the revision prompt through your AI on more of the material and paste a new set.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setMastery({}); persist({}, calibration); }} className="text-pencil">
              Practice again from scratch
            </Button>
            <Button onClick={() => { clearRevisionState(); onRestart(); }} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              New set
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
