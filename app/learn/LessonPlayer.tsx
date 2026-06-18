"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";
import type {
  KLesson,
  KLessonConcept,
  KCheck,
} from "@/lib/keystone/schema";
import type { KProgress } from "@/lib/keystone/storage";

/* ----------------------------- small helpers ---------------------------- */

/** Render Markdown + LaTeX content. */
function Md({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className ?? "text-sm leading-relaxed text-ink"}>
      <MathRenderer text={text} />
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="space-y-0.5">
      <p className="type-data text-[11px] uppercase tracking-wide text-st-review">{kicker}</p>
      <h2 className="type-display text-xl text-ink">{title}</h2>
    </div>
  );
}

/** Textarea the student must write in before they can proceed/reveal. */
function AttemptBox({
  value,
  onChange,
  placeholder,
  minChars = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minChars?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      placeholder={placeholder ?? "Write your attempt here — even a rough one. The struggle is the point."}
      className="w-full resize-y rounded-md border border-rule bg-paper p-3 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
      data-min={minChars}
    />
  );
}

/** Hints released one rung at a time. */
function HintLadder({ hints }: { hints: string[] }) {
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
        <Button variant="ghost" size="sm" onClick={() => setShown((s) => s + 1)} className="text-ballpoint">
          {shown === 0 ? "Show a hint" : "Show another hint"} ({hints.length - shown} left)
        </Button>
      )}
    </div>
  );
}

/** Predict-then-reveal confidence (1–5). Returns the prediction once chosen. */
function Calibrate({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
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
function SelfScore({
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

/* ------------------------------ check card ------------------------------- */

function CheckCard({
  check,
  onScored,
}: {
  check: KCheck;
  onScored: (score: 0 | 1 | 2) => void;
}) {
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [scored, setScored] = useState<number | null>(null);

  return (
    <div className="space-y-3 rounded-md border border-rule bg-paper p-4">
      <div className="flex items-center gap-2">
        <span className="type-data rounded border border-st-review/30 bg-st-review/10 px-1.5 py-0.5 text-[10px] uppercase text-st-review">
          {check.kind}
        </span>
      </div>
      <Md text={check.question} />
      {!revealed ? (
        <>
          <AttemptBox value={attempt} onChange={setAttempt} />
          <Button
            size="sm"
            onClick={() => setRevealed(true)}
            disabled={attempt.trim().length < 1}
            className="bg-ballpoint text-paper hover:bg-ballpoint/90"
          >
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
              setScored(n);
              onScored(n);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* --------------------------- concept sub-stepper -------------------------- */

const SUBSTEPS = ["Attempt", "Learn", "Practice", "Teach back"] as const;

function ConceptView({
  concept,
  index,
  total,
  onDone,
  onCalibration,
}: {
  concept: KLessonConcept;
  index: number;
  total: number;
  onDone: () => void;
  onCalibration: (predicted: number, outcome: number) => void;
}) {
  const [sub, setSub] = useState(0);

  // Attempt
  const [anchorAttempt, setAnchorAttempt] = useState("");
  const [anchorRevealed, setAnchorRevealed] = useState(false);

  // Learn (worked example self-explanations + derivation)
  const [explained, setExplained] = useState<string[]>(concept.workedExample.map(() => ""));
  const [derivAttempt, setDerivAttempt] = useState<string[]>(concept.derivation.map(() => ""));
  const [derivShown, setDerivShown] = useState<boolean[]>(concept.derivation.map(() => false));

  // Teach back
  const [explanation, setExplanation] = useState("");
  const [checked, setChecked] = useState<boolean[]>((concept.teachBack?.checklist ?? []).map(() => false));

  // Calibration (predict before the practice checks)
  const [predicted, setPredicted] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <SectionHead kicker={`Concept ${index + 1} of ${total}`} title={concept.name} />

      {/* sub-step rail */}
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {SUBSTEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className={`type-data rounded-full px-2 py-0.5 ${
                i === sub ? "bg-ballpoint text-paper" : i < sub ? "bg-st-answered/15 text-st-answered" : "border border-rule text-pencil"
              }`}
            >
              {label}
            </span>
            {i < SUBSTEPS.length - 1 && <span className="text-rule">—</span>}
          </li>
        ))}
      </ol>

      {/* 0 — ATTEMPT (anchor problem, productive failure) */}
      {sub === 0 && (
        <div className="paper-sheet space-y-4 p-5">
          {concept.anchorProblem ? (
            <>
              <p className="type-data text-[11px] text-pencil">
                Try this <strong className="text-ink">before</strong> any teaching. Struggling here is the point — it
                shows you what you don’t yet understand and primes the explanation.
              </p>
              <Md text={concept.anchorProblem.prompt} />
              {!anchorRevealed ? (
                <>
                  <AttemptBox value={anchorAttempt} onChange={setAnchorAttempt} />
                  <HintLadder hints={concept.hintLadder} />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setAnchorRevealed(true)}
                      disabled={anchorAttempt.trim().length < 1}
                      className="bg-ballpoint text-paper hover:bg-ballpoint/90"
                    >
                      I’ve attempted it →
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {concept.anchorProblem.whatToNotice && (
                    <div className="rounded-md border border-st-review/30 bg-st-review/5 p-3">
                      <p className="type-data text-[11px] text-st-review">What to notice</p>
                      <Md text={concept.anchorProblem.whatToNotice} />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={() => setSub(1)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                      Now learn it →
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-pencil">No anchor problem for this concept — go straight to learning it.</p>
              <Button onClick={() => setSub(1)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                Learn it →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 1 — LEARN (worked example + self-explanation, then co-produced derivation) */}
      {sub === 1 && (
        <div className="space-y-4">
          {concept.workedExample.length > 0 && (
            <div className="paper-sheet space-y-4 p-5">
              <h3 className="type-display text-base text-ink">Worked example</h3>
              <p className="type-data text-[11px] text-pencil">
                Explain each step in your own words — about the <em>content</em>, not whether you “get it”.
              </p>
              {concept.workedExample.map((step, i) => (
                <div key={i} className="space-y-2 border-l-2 border-rule pl-3">
                  <Md text={step.text} />
                  {step.selfExplain && (
                    <div className="space-y-1">
                      <p className="type-data text-[11px] text-st-review">{step.selfExplain}</p>
                      <input
                        value={explained[i]}
                        onChange={(e) => setExplained((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                        placeholder="Your explanation…"
                        className="w-full rounded-md border border-rule bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {concept.derivation.length > 0 && (
            <div className="paper-sheet space-y-4 p-5">
              <h3 className="type-display text-base text-ink">Derive it from first principles</h3>
              <p className="type-data text-[11px] text-pencil">
                Co-produce each step — attempt it, then reveal. This is the difference between understanding a result
                and just using a formula.
              </p>
              {concept.derivation.map((step, i) => (
                <div key={i} className="space-y-2 border-l-2 border-rule pl-3">
                  <Md text={step.prompt} className="text-sm text-ink" />
                  {!derivShown[i] ? (
                    <div className="space-y-2">
                      <input
                        value={derivAttempt[i]}
                        onChange={(e) => setDerivAttempt((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                        placeholder="What comes next, and why?"
                        className="w-full rounded-md border border-rule bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDerivShown((a) => a.map((v, j) => (j === i ? true : v)))}
                        className="text-ballpoint"
                      >
                        Reveal this step
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-2">
                      <Md text={step.answer} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {concept.misconceptions.length > 0 && (
            <details className="paper-sheet p-4">
              <summary className="cursor-pointer text-sm text-ink">Common misconceptions to watch for</summary>
              <ul className="mt-3 space-y-2">
                {concept.misconceptions.map((m, i) => (
                  <li key={i} className="space-y-0.5">
                    <p className="text-sm text-redpen">✗ {m.misconception}</p>
                    <Md text={m.correction} className="text-sm text-pencil" />
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setSub(2)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              Practice →
            </Button>
          </div>
        </div>
      )}

      {/* 2 — PRACTICE (calibration + retrieval/transfer checks) */}
      {sub === 2 && (
        <div className="space-y-4">
          <div className="paper-sheet space-y-4 p-5">
            <h3 className="type-display text-base text-ink">Prove you’ve got it</h3>
            {concept.checks.length === 0 && !concept.calibration && (
              <p className="text-sm text-pencil">No checks were generated for this concept.</p>
            )}
            {concept.calibration && concept.checks.length > 0 && predicted === null && (
              <div className="rounded-md border border-rule bg-secondary/20 p-3">
                <Calibrate value={predicted} onChange={setPredicted} />
              </div>
            )}
            {concept.checks.map((c, i) => (
              <CheckCard
                key={i}
                check={c}
                onScored={(score) => {
                  if (i === 0 && predicted !== null) onCalibration(predicted, score);
                }}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSub(3)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              Teach it back →
            </Button>
          </div>
        </div>
      )}

      {/* 3 — TEACH BACK (protégé effect + self-evaluation) */}
      {sub === 3 && (
        <div className="paper-sheet space-y-4 p-5">
          <h3 className="type-display text-base text-ink">Teach it back</h3>
          <p className="type-data text-[11px] text-pencil">
            Explain it as if teaching someone else — the surest test of real understanding. Then check yourself against
            the list. (You can also paste this explanation back into your own AI and ask it to critique you.)
          </p>
          {concept.teachBack?.whatToExplain && <Md text={concept.teachBack.whatToExplain} className="text-sm text-ink" />}
          <AttemptBox
            value={explanation}
            onChange={setExplanation}
            placeholder="Explain the concept in your own words, from the ground up…"
          />
          {(concept.teachBack?.checklist?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="type-data text-[11px] text-pencil">Your explanation should cover:</p>
              <ul className="space-y-1">
                {concept.teachBack!.checklist.map((c, i) => (
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
          <div className="flex justify-end">
            <Button
              onClick={onDone}
              disabled={explanation.trim().length < 1}
              className="bg-ballpoint text-paper hover:bg-ballpoint/90"
            >
              {index + 1 < total ? "Mark understood — next concept →" : "Mark understood →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- the player -------------------------------- */

type View =
  | { kind: "map" }
  | { kind: "prereqs" }
  | { kind: "concept"; i: number }
  | { kind: "interleave" }
  | { kind: "synthesis" }
  | { kind: "done" };

export default function LessonPlayer({
  lesson,
  progress,
  onProgress,
  onRestart,
}: {
  lesson: KLesson;
  progress: KProgress;
  onProgress: (p: KProgress) => void;
  onRestart: () => void;
}) {
  const [view, setView] = useState<View>({ kind: "map" });

  const conceptCount = lesson.concepts.length;
  const mapConcepts = lesson.conceptMap.concepts.length
    ? lesson.conceptMap.concepts
    : lesson.concepts.map((c) => ({ id: c.id, name: c.name, dependsOn: [] as string[] }));

  function advanceFrom(v: View): View {
    switch (v.kind) {
      case "map":
        return lesson.prerequisites.length ? { kind: "prereqs" } : conceptCount ? { kind: "concept", i: 0 } : { kind: "done" };
      case "prereqs":
        return conceptCount ? { kind: "concept", i: 0 } : { kind: "done" };
      case "concept":
        return v.i + 1 < conceptCount
          ? { kind: "concept", i: v.i + 1 }
          : lesson.interleaved.length
          ? { kind: "interleave" }
          : lesson.synthesis.length
          ? { kind: "synthesis" }
          : { kind: "done" };
      case "interleave":
        return lesson.synthesis.length ? { kind: "synthesis" } : { kind: "done" };
      case "synthesis":
        return { kind: "done" };
      default:
        return { kind: "done" };
    }
  }

  const donePct = Math.round((progress.doneConceptIds.length / Math.max(1, conceptCount)) * 100);

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* header + progress */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="type-display text-2xl text-ink">{lesson.title}</h1>
            {lesson.subject && <p className="type-data text-xs text-pencil">{lesson.subject}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onRestart} className="text-pencil">
            Start over
          </Button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule/40">
          <div className="h-full rounded-full bg-st-answered transition-all" style={{ width: `${donePct}%` }} />
        </div>
        <p className="type-data text-[11px] text-pencil">
          {progress.doneConceptIds.length}/{conceptCount} concepts understood
        </p>
      </div>

      {/* MAP — advance organizer */}
      {view.kind === "map" && (
        <div className="paper-sheet space-y-4 p-5">
          <SectionHead kicker="Advance organizer" title="The shape of this chapter" />
          {lesson.conceptMap.summary && <Md text={lesson.conceptMap.summary} />}
          <ol className="space-y-1.5">
            {mapConcepts.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 text-sm text-ink">
                <span className="type-data flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule text-[11px] text-pencil">
                  {i + 1}
                </span>
                <span>{c.name}</span>
                {progress.doneConceptIds.includes(c.id) && <span className="text-st-answered">✓</span>}
              </li>
            ))}
          </ol>
          <p className="type-data text-[11px] text-pencil">
            You’ll attempt each idea before being taught it, derive it yourself, prove you can transfer it, and teach it
            back. A concept counts as understood only when you can produce it — not when it feels familiar.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setView(advanceFrom(view))} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              {lesson.prerequisites.length ? "Check prerequisites →" : "Begin →"}
            </Button>
          </div>
        </div>
      )}

      {/* PREREQS */}
      {view.kind === "prereqs" && (
        <div className="space-y-4">
          <SectionHead kicker="Foundations first" title="Quick prerequisite check" />
          <p className="text-sm text-pencil">
            Make sure the ground is solid before we build. Try each, then reveal — if one’s shaky, shore it up first.
          </p>
          {lesson.prerequisites.map((p, i) => (
            <PrereqCard key={i} question={p.question} modelAnswer={p.modelAnswer} ifShaky={p.ifShaky} />
          ))}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                onProgress({ ...progress, prereqsDone: true });
                setView(advanceFrom(view));
              }}
              className="bg-ballpoint text-paper hover:bg-ballpoint/90"
            >
              Foundations are solid — start →
            </Button>
          </div>
        </div>
      )}

      {/* CONCEPT */}
      {view.kind === "concept" && lesson.concepts[view.i] && (
        <ConceptView
          key={lesson.concepts[view.i].id}
          concept={lesson.concepts[view.i]}
          index={view.i}
          total={conceptCount}
          onCalibration={(predicted, outcome) =>
            onProgress({
              ...progress,
              calibration: [...progress.calibration, { conceptId: lesson.concepts[view.i].id, predicted, outcome }],
            })
          }
          onDone={() => {
            const id = lesson.concepts[view.i].id;
            const doneConceptIds = progress.doneConceptIds.includes(id)
              ? progress.doneConceptIds
              : [...progress.doneConceptIds, id];
            onProgress({ ...progress, doneConceptIds });
            setView(advanceFrom(view));
            if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* INTERLEAVE */}
      {view.kind === "interleave" && (
        <div className="space-y-4">
          <SectionHead kicker="Mix it up" title="Interleaved practice" />
          <p className="text-sm text-pencil">
            These mix the chapter’s concepts. The hard part of a real exam is working out <em>which</em> idea applies —
            so name it first, then solve.
          </p>
          {lesson.interleaved.map((q, i) => (
            <InterleaveCard key={i} prompt={q.prompt} whichConcept={q.whichConcept} modelAnswer={q.modelAnswer} />
          ))}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                onProgress({ ...progress, interleaveDone: true });
                setView(advanceFrom(view));
              }}
              className="bg-ballpoint text-paper hover:bg-ballpoint/90"
            >
              {lesson.synthesis.length ? "Synthesis →" : "Finish →"}
            </Button>
          </div>
        </div>
      )}

      {/* SYNTHESIS */}
      {view.kind === "synthesis" && (
        <div className="space-y-4">
          <SectionHead kicker="The bigger picture" title="Pull it together" />
          {lesson.synthesis.map((q, i) => (
            <PrereqCard key={i} question={q.question} modelAnswer={q.modelAnswer} ifShaky={null} />
          ))}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                onProgress({ ...progress, synthesisDone: true });
                setView(advanceFrom(view));
              }}
              className="bg-ballpoint text-paper hover:bg-ballpoint/90"
            >
              Finish lesson →
            </Button>
          </div>
        </div>
      )}

      {/* DONE */}
      {view.kind === "done" && (
        <div className="paper-sheet space-y-4 p-5">
          <SectionHead kicker="Well done" title="Lesson complete" />
          <p className="text-sm text-pencil">
            You attempted, derived, proved transfer, and taught back {progress.doneConceptIds.length} concept
            {progress.doneConceptIds.length === 1 ? "" : "s"}. That’s understanding you produced — not just recognised.
          </p>
          {lesson.spacing.length > 0 && (
            <div className="rounded-md border border-st-review/30 bg-st-review/5 p-3">
              <p className="type-data text-[11px] text-st-review">Come back on this schedule so it sticks</p>
              <ul className="mt-1 space-y-0.5">
                {lesson.spacing.map((s, i) => {
                  const name = lesson.concepts.find((c) => c.id === s.conceptId)?.name ?? s.conceptId;
                  return (
                    <li key={i} className="type-data text-xs text-pencil">
                      {name} — revisit after {s.returnAfter}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {progress.calibration.length > 0 && <CalibrationSummary progress={progress} />}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView({ kind: "map" })}>
              Review the map
            </Button>
            <Button onClick={onRestart} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              New lesson
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- leaf reveal cards --------------------------- */

function PrereqCard({
  question,
  modelAnswer,
  ifShaky,
}: {
  question: string;
  modelAnswer: string;
  ifShaky: string | null;
}) {
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="paper-sheet space-y-3 p-4">
      <Md text={question} />
      {!revealed ? (
        <>
          <AttemptBox value={attempt} onChange={setAttempt} minChars={1} />
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

function InterleaveCard({
  prompt,
  whichConcept,
  modelAnswer,
}: {
  prompt: string;
  whichConcept: string;
  modelAnswer: string;
}) {
  const [which, setWhich] = useState("");
  const [attempt, setAttempt] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="paper-sheet space-y-3 p-4">
      <Md text={prompt} />
      {!revealed ? (
        <div className="space-y-2">
          <input
            value={which}
            onChange={(e) => setWhich(e.target.value)}
            placeholder="Which concept does this test?"
            className="w-full rounded-md border border-rule bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
          />
          <AttemptBox value={attempt} onChange={setAttempt} placeholder="Then solve it…" />
          <Button size="sm" onClick={() => setRevealed(true)} disabled={attempt.trim().length < 1} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
            Check
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {whichConcept && (
            <p className="type-data text-[11px] text-pencil">
              Concept tested: <span className="text-ink">{whichConcept}</span>
            </p>
          )}
          <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
            <p className="type-data text-[11px] text-st-answered">Model answer</p>
            <Md text={modelAnswer || "—"} />
          </div>
        </div>
      )}
    </div>
  );
}

function CalibrationSummary({ progress }: { progress: KProgress }) {
  const rows = progress.calibration;
  const avgGap =
    rows.reduce((acc, r) => acc + Math.abs(r.predicted / 5 - r.outcome / 2), 0) / Math.max(1, rows.length);
  const pct = Math.round((1 - avgGap) * 100);
  return (
    <div className="rounded-md border border-rule bg-secondary/20 p-3">
      <p className="type-data text-[11px] text-pencil">Calibration — how well your confidence matched your results</p>
      <p className="text-sm text-ink">
        {pct}% aligned{" "}
        <span className="type-data text-[11px] text-pencil">
          ({rows.length} check{rows.length === 1 ? "" : "s"}). Closing this gap is how you stop the fluency illusion
          fooling you.
        </span>
      </p>
    </div>
  );
}
