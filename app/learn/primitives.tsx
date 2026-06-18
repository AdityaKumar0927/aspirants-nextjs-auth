"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";
import type { KCheck, KPrereq } from "@/lib/keystone/schema";
import { gradeAnswer } from "@/lib/keystone/grade";

/** Render Markdown + LaTeX content. Shared by every Learn player. */
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

/* ============================ two-surface acts ============================ */
/* The student THINKS on their own paper; these capture only a committable
   answer + confidence, or a "done — compare to the model" self-assessment. */

/** "Work it on your paper" → reveal a model to compare against → optional checklist.
 *  No textarea: the generation already happened on paper (kills typing friction). */
export function PaperReveal({
  prompt,
  model,
  checklist,
  kicker,
  doneLabel,
}: {
  prompt: string;
  model?: string | null;
  checklist?: string[];
  kicker?: string;
  doneLabel?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<boolean[]>((checklist ?? []).map(() => false));
  return (
    <div className="space-y-3 rounded-md border border-rule bg-paper p-4">
      {kicker && <p className="type-data text-[11px] uppercase tracking-wide text-st-review">{kicker}</p>}
      <Md text={prompt} />
      {!revealed ? (
        <Button size="sm" onClick={() => setRevealed(true)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
          {doneLabel ?? "I’ve worked it on paper — show me"}
        </Button>
      ) : (
        <div className="space-y-2">
          {model && (
            <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
              <p className="type-data text-[11px] text-st-answered">Compare with</p>
              <Md text={model} />
            </div>
          )}
          {(checklist?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="type-data text-[11px] text-pencil">Tick what your work covered:</p>
              <ul className="space-y-1">
                {checklist!.map((c, i) => (
                  <li key={i}>
                    <label className="flex items-start gap-2 text-sm text-pencil">
                      <input
                        type="checkbox"
                        checked={checked[i]}
                        onChange={() => setChecked((a) => a.map((v, j) => (j === i ? !v : v)))}
                        className="mt-1"
                      />
                      <Md text={c} className="text-sm text-pencil" />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================== auto-graded checks ======================== */

function CheckTags({ check }: { check: KCheck }) {
  return (
    <div className="flex items-center gap-2">
      <span className="type-data rounded border border-st-review/30 bg-st-review/10 px-1.5 py-0.5 text-[10px] uppercase text-st-review">{check.kind}</span>
      {check.level && (
        <span className="type-data rounded border border-rule px-1.5 py-0.5 text-[10px] uppercase text-pencil">{check.level}</span>
      )}
    </div>
  );
}

/** Legacy / "open" check: free-text attempt → reveal model → manual self-score. */
function CheckCard({ check, onScored }: { check: KCheck; onScored: (n: 0 | 1 | 2) => void }) {
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [scored, setScored] = useState<number | null>(null);
  return (
    <div className="space-y-3 rounded-md border border-rule bg-paper p-4">
      <CheckTags check={check} />
      <Md text={check.question} />
      {!revealed ? (
        <>
          <AttemptBox value={attempt} onChange={setAttempt} />
          <Button size="sm" onClick={() => setRevealed(true)} disabled={attempt.trim().length < 1} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
            Check my answer
          </Button>
        </>
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
            <Md text={check.modelAnswer || "—"} />
          </div>
          <SelfScore
            rubric={check.rubric}
            scored={scored}
            onScore={(n) => {
              // Fire the outcome once (first selection) so a re-tap can't double-count
              // the struggle delta; the visible selection can still be corrected.
              if (scored === null) onScored(n);
              setScored(n);
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Multiple-choice with competitive, misconception-mapped distractors. Auto-graded. */
function McqCheck({ check, onScored }: { check: KCheck; onScored: (n: 0 | 1 | 2) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);
  const correct = picked !== null && !!check.options[picked]?.correct;
  return (
    <div className="space-y-3 rounded-md border border-rule bg-paper p-4">
      <CheckTags check={check} />
      <Md text={check.question} />
      <div className="space-y-1.5">
        {check.options.map((o, i) => {
          let cls = "border-rule bg-paper text-ink hover:border-ballpoint/50";
          if (!committed && picked === i) cls = "border-ballpoint bg-ballpoint/10 text-ink";
          else if (committed && o.correct) cls = "border-st-answered bg-st-answered/10 text-ink";
          else if (committed && picked === i && !o.correct) cls = "border-redpen bg-redpen/10 text-ink";
          else if (committed) cls = "border-rule bg-paper text-pencil";
          return (
            <button
              key={i}
              type="button"
              disabled={committed}
              onClick={() => setPicked(i)}
              className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${cls}`}
            >
              <span className="type-data shrink-0 text-pencil">{String.fromCharCode(65 + i)}.</span>
              <Md text={o.text} className="text-sm" />
            </button>
          );
        })}
      </div>
      {!committed ? (
        <Button
          size="sm"
          disabled={picked === null}
          onClick={() => {
            setCommitted(true);
            onScored(check.options[picked!]?.correct ? 2 : 0);
          }}
          className="bg-ballpoint text-paper hover:bg-ballpoint/90"
        >
          Check my answer
        </Button>
      ) : (
        <div className="space-y-2">
          {!correct && picked !== null && check.options[picked]?.misconception && (
            <div className="rounded-md border border-redpen/30 bg-redpen/5 p-3">
              <p className="type-data text-[11px] text-redpen">Why that option is tempting</p>
              <Md text={check.options[picked]!.misconception!} className="text-sm text-pencil" />
            </div>
          )}
          {check.modelAnswer && (
            <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
              <p className="type-data text-[11px] text-st-answered">{correct ? "Correct" : "The answer"}</p>
              <Md text={check.modelAnswer} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Integer / fill-blank / short answer — auto-graded, with a manual override so a
 *  too-strict match never traps the student. */
function AnswerCheck({ check, onScored }: { check: KCheck; onScored: (n: 0 | 1 | 2) => void }) {
  const [val, setVal] = useState("");
  const [committed, setCommitted] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const auto = committed && gradeAnswer(check.format, check.answer ?? "", val);
  const correct = auto || overridden;
  return (
    <div className="space-y-3 rounded-md border border-rule bg-paper p-4">
      <CheckTags check={check} />
      <Md text={check.question} />
      {!committed ? (
        <div className="space-y-2">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            inputMode={check.format === "integer" ? "decimal" : "text"}
            placeholder={check.format === "integer" ? "Your number" : "Your answer"}
            className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
          />
          <Button
            size="sm"
            disabled={val.trim().length < 1}
            onClick={() => {
              const ok = gradeAnswer(check.format, check.answer ?? "", val);
              setCommitted(true);
              onScored(ok ? 2 : 0);
            }}
            className="bg-ballpoint text-paper hover:bg-ballpoint/90"
          >
            Check my answer
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className={`rounded-md border p-3 ${correct ? "border-st-answered/40 bg-st-answered/5" : "border-redpen/40 bg-redpen/5"}`}>
            <p className={`type-data text-[11px] ${correct ? "text-st-answered" : "text-redpen"}`}>{correct ? "Correct" : "Not quite"}</p>
            <p className="text-sm text-pencil">You answered: <span className="text-ink">{val}</span></p>
          </div>
          <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
            <p className="type-data text-[11px] text-st-answered">Model answer</p>
            <Md text={check.modelAnswer || check.answer || "—"} />
          </div>
          {!auto && !overridden && (
            <Button variant="ghost" size="sm" onClick={() => setOverridden(true)} className="text-ballpoint">
              My answer was equivalent — mark it correct
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Dispatch a check to the right widget; "open"/unusable fall back to free-text. */
export function AutoCheckCard({ check, onScored }: { check: KCheck; onScored: (n: 0 | 1 | 2) => void }) {
  if (check.format === "mcq" && check.options.length > 0) return <McqCheck check={check} onScored={onScored} />;
  if ((check.format === "integer" || check.format === "fillblank" || check.format === "short") && check.answer) {
    return <AnswerCheck check={check} onScored={onScored} />;
  }
  return <CheckCard check={check} onScored={onScored} />;
}

/* ============================== prerequisite gate ======================== */

function LegacyReveal({ question, modelAnswer, ifShaky }: { question: string; modelAnswer: string; ifShaky: string | null }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="paper-sheet space-y-3 p-4">
      <Md text={question} />
      {!revealed ? (
        <Button size="sm" onClick={() => setRevealed(true)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
          Work it on paper, then reveal
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
            <p className="type-data text-[11px] text-st-answered">Model answer</p>
            <Md text={modelAnswer || "—"} />
          </div>
          {ifShaky && (
            <p className="type-data text-[11px] text-pencil">
              <span className="text-orange-600 dark:text-orange-400">If this was shaky:</span> {ifShaky}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Diagnostic prerequisite: auto-grade the foundation; on a wrong answer show a
 *  just-in-time refresher and let them re-check. Falls back to a reveal card for
 *  "open"/legacy prereqs. */
export function PrereqGate({ prereq }: { prereq: KPrereq }) {
  const isMcq = prereq.format === "mcq" && prereq.options.length > 0;
  const autoGradable = isMcq || ((prereq.format === "integer" || prereq.format === "fillblank" || prereq.format === "short") && !!prereq.answer);

  const [picked, setPicked] = useState<number | null>(null);
  const [val, setVal] = useState("");
  const [committed, setCommitted] = useState(false);

  if (!autoGradable) {
    return <LegacyReveal question={prereq.question} modelAnswer={prereq.modelAnswer} ifShaky={prereq.ifShaky} />;
  }

  const correct = isMcq
    ? picked !== null && !!prereq.options[picked]?.correct
    : gradeAnswer(prereq.format, prereq.answer ?? "", val);

  return (
    <div className="paper-sheet space-y-3 p-4">
      <Md text={prereq.question} />
      {!committed ? (
        <div className="space-y-2">
          {isMcq ? (
            <div className="space-y-1.5">
              {prereq.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPicked(i)}
                  className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
                    picked === i ? "border-ballpoint bg-ballpoint/10 text-ink" : "border-rule bg-paper text-ink hover:border-ballpoint/50"
                  }`}
                >
                  <span className="type-data shrink-0 text-pencil">{String.fromCharCode(65 + i)}.</span>
                  <Md text={o.text} className="text-sm" />
                </button>
              ))}
            </div>
          ) : (
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              inputMode={prereq.format === "integer" ? "decimal" : "text"}
              placeholder="Your answer"
              className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
            />
          )}
          <Button
            size="sm"
            disabled={isMcq ? picked === null : val.trim().length < 1}
            onClick={() => setCommitted(true)}
            className="bg-ballpoint text-paper hover:bg-ballpoint/90"
          >
            Check
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className={`rounded-md border p-3 ${correct ? "border-st-answered/40 bg-st-answered/5" : "border-redpen/40 bg-redpen/5"}`}>
            <p className={`type-data text-[11px] ${correct ? "text-st-answered" : "text-redpen"}`}>
              {correct ? "Solid — this foundation is there" : "Worth shoring up first"}
            </p>
            {prereq.modelAnswer && <Md text={prereq.modelAnswer} className="text-sm text-pencil" />}
          </div>
          {!correct && prereq.refresher && (
            <div className="rounded-md border border-st-review/30 bg-st-review/5 p-3">
              <p className="type-data text-[11px] text-st-review">Quick refresher</p>
              <Md text={prereq.refresher} />
            </div>
          )}
          {!correct && prereq.ifShaky && (
            <p className="type-data text-[11px] text-pencil">
              <span className="text-orange-600 dark:text-orange-400">Revisit:</span> {prereq.ifShaky}
            </p>
          )}
          {!correct && (
            <Button variant="ghost" size="sm" onClick={() => { setCommitted(false); setPicked(null); setVal(""); }} className="text-ballpoint">
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
