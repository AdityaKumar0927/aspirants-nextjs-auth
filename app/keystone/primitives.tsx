"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";

/** Render Markdown + LaTeX content. Shared by every Keystone player. */
export function Md({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className ?? "text-sm leading-relaxed text-ink"}>
      <MathRenderer text={text} />
    </div>
  );
}

export function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="space-y-0.5">
      <p className="type-data text-[11px] uppercase tracking-wide text-st-review">{kicker}</p>
      <h2 className="type-display text-xl text-ink">{title}</h2>
    </div>
  );
}

/** Textarea the student must write in before they can proceed/reveal. */
export function AttemptBox({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder ?? "Write your attempt here — even a rough one. The struggle is the point."}
      className="w-full resize-y rounded-md border border-rule bg-paper p-3 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
    />
  );
}

/** Hints released one rung at a time — never the answer. */
export function HintLadder({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;
  return (
    <div className="space-y-2 rounded-md border border-dashed border-rule bg-secondary/30 p-3">
      <p className="type-data text-[11px] text-pencil">Stuck? Reveal one hint at a time — never the answer.</p>
      <ol className="space-y-1.5">
        {hints.slice(0, shown).map((h, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink">
            <span className="type-data shrink-0 text-st-review">Hint {i + 1}.</span>
            <Md text={h} className="text-sm text-ink" />
          </li>
        ))}
      </ol>
      {shown < hints.length && (
        <Button variant="ghost" size="sm" onClick={() => setShown((x) => x + 1)} className="text-ballpoint">
          {shown === 0 ? "Show a hint" : "Show another hint"} ({hints.length - shown} left)
        </Button>
      )}
    </div>
  );
}

/** Predict-then-reveal confidence (1–5). The countermeasure to the fluency illusion. */
export function Calibrate({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="type-data text-[11px] text-pencil">First, predict: how confident are you that you’ll get this right?</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`type-data h-8 w-8 rounded-full border text-xs transition ${
              value === n ? "border-ballpoint bg-ballpoint text-paper" : "border-rule bg-paper text-pencil hover:border-ballpoint/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Self-score after a reveal: Got it / Partly / Missed, plus a rubric to check against. */
export function SelfScore({
  rubric,
  onScore,
  scored,
}: {
  rubric: string[];
  onScore: (n: 0 | 1 | 2) => void;
  scored: number | null;
}) {
  const opts: { n: 0 | 1 | 2; label: string; cls: string }[] = [
    { n: 2, label: "Got it", cls: "border-st-answered text-st-answered" },
    { n: 1, label: "Partly", cls: "border-orange-500/50 text-orange-600 dark:text-orange-400" },
    { n: 0, label: "Missed", cls: "border-redpen/50 text-redpen" },
  ];
  return (
    <div className="space-y-2">
      {rubric.length > 0 && (
        <div className="space-y-1">
          <p className="type-data text-[11px] text-pencil">Did your answer include:</p>
          <ul className="space-y-0.5">
            {rubric.map((r, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-pencil">
                <span className="text-st-review">▢</span>
                <Md text={r} className="text-xs text-pencil" />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        {opts.map((o) => (
          <button
            key={o.n}
            type="button"
            onClick={() => onScore(o.n)}
            className={`type-data rounded-full border px-3 py-1 text-xs transition ${
              scored === o.n ? "bg-ink text-paper border-ink" : `bg-paper ${o.cls} hover:opacity-80`
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Reveal-after-attempt card used for prereqs, synthesis, etc. */
export function ProduceReveal({
  question,
  modelAnswer,
  footnote,
  attemptPlaceholder,
}: {
  question: string;
  modelAnswer: string;
  footnote?: { label: string; text: string } | null;
  attemptPlaceholder?: string;
}) {
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="paper-sheet space-y-3 p-4">
      <Md text={question} />
      {!revealed ? (
        <>
          <AttemptBox value={attempt} onChange={setAttempt} placeholder={attemptPlaceholder} />
          <Button size="sm" onClick={() => setRevealed(true)} disabled={attempt.trim().length < 1} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
            Reveal
          </Button>
        </>
      ) : (
        <div className="space-y-2">
          <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
            <p className="type-data text-[11px] text-st-answered">Model answer</p>
            <Md text={modelAnswer || "—"} />
          </div>
          {footnote && (
            <p className="type-data text-[11px] text-pencil">
              <span className="text-orange-600 dark:text-orange-400">{footnote.label}</span> {footnote.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
