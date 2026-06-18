"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { KLesson, KLessonConcept } from "@/lib/keystone/schema";
import type { KProgress } from "@/lib/keystone/storage";
import {
  Md,
  SectionHead,
  HintLadder,
  Calibrate,
  PaperReveal,
  AutoCheckCard,
  PrereqGate,
} from "./primitives";

/* --------------------------- concept sub-stepper -------------------------- */

function ConceptView({
  concept,
  index,
  total,
  struggle,
  onStruggleDelta,
  onDone,
  onCalibration,
}: {
  concept: KLessonConcept;
  index: number;
  total: number;
  struggle: number;
  onStruggleDelta: (d: number) => void;
  onDone: () => void;
  onCalibration: (predicted: number, outcome: number) => void;
}) {
  // The step list is dynamic: the Generate step only appears when there are
  // generative acts to do (otherwise the rail would show an empty step).
  const steps = ["Pretest", "Learn", ...(concept.generative.length ? (["Generate"] as const) : []), "Check", "Teach back"];
  const [sub, setSub] = useState(0);
  const current = steps[sub];
  const goNext = () => setSub((s) => Math.min(s + 1, steps.length - 1));

  // Pretest
  const [anchorRevealed, setAnchorRevealed] = useState(false);

  // Check — predict-confidence once, then auto-graded checks; the FIRST check's
  // outcome is the calibration signal (recorded once).
  const [predicted, setPredicted] = useState<number | null>(null);
  const calibRecorded = useRef(false);

  // Teach back self-assessment
  const [checked, setChecked] = useState<boolean[]>((concept.teachBack?.checklist ?? []).map(() => false));

  // Guidance fading: when the student is clearly doing well across the lesson,
  // collapse the worked example by default (they can still expand it).
  const faded = struggle <= -2;

  return (
    <div className="space-y-5">
      <SectionHead kicker={`Concept ${index + 1} of ${total}`} title={concept.name} />

      {/* sub-step rail */}
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className={`type-data rounded-full px-2 py-0.5 ${
                i === sub ? "bg-ballpoint text-paper" : i < sub ? "bg-st-answered/15 text-st-answered" : "border border-rule text-pencil"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="text-rule">—</span>}
          </li>
        ))}
      </ol>

      {/* PRETEST — attempt on paper before any teaching, then a substantial reveal */}
      {current === "Pretest" && (
        <div className="paper-sheet space-y-4 p-5">
          {concept.anchorProblem ? (
            <>
              <p className="type-data text-[11px] text-pencil">
                A quick <strong className="text-ink">pretest</strong> — attempt it on your paper <strong className="text-ink">before</strong> any
                teaching. Getting it wrong is expected and is the point: the struggle primes what comes next.
              </p>
              <Md text={concept.anchorProblem.prompt} />
              {!anchorRevealed ? (
                <>
                  <HintLadder hints={concept.hintLadder} />
                  <div className="flex justify-end">
                    <Button onClick={() => setAnchorRevealed(true)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                      I’ve attempted it on paper →
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {concept.anchorProblem.reveal && (
                    <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
                      <p className="type-data text-[11px] text-st-answered">Here’s the thinking — study it now</p>
                      <Md text={concept.anchorProblem.reveal} />
                    </div>
                  )}
                  {concept.anchorProblem.whatToNotice && (
                    <div className="rounded-md border border-st-review/30 bg-st-review/5 p-3">
                      <p className="type-data text-[11px] text-st-review">What to notice</p>
                      <Md text={concept.anchorProblem.whatToNotice} />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={goNext} className="bg-ballpoint text-paper hover:bg-ballpoint/90">Now learn it →</Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-pencil">No pretest for this concept — go straight to learning it.</p>
              <Button onClick={goNext} className="bg-ballpoint text-paper hover:bg-ballpoint/90">Learn it →</Button>
            </div>
          )}
        </div>
      )}

      {/* LEARN — rich worked example (density fades as the student does well) + derivation */}
      {current === "Learn" && (
        <div className="space-y-4">
          {concept.workedExample.length > 0 && (
            <details open={!faded} className="paper-sheet space-y-4 p-5">
              <summary className="cursor-pointer">
                <span className="type-display text-base text-ink">Worked example</span>
                {faded && <span className="type-data ml-2 text-[11px] text-pencil">(you’re on a roll — expand if you want it)</span>}
              </summary>
              <p className="type-data mt-3 text-[11px] text-pencil">
                Read each step and the reason it follows. On your paper, answer each “On paper:” prompt in your own words.
              </p>
              <div className="mt-3 space-y-4">
                {concept.workedExample.map((step, i) => (
                  <div key={i} className="space-y-1 border-l-2 border-rule pl-3">
                    <Md text={step.text} />
                    {step.selfExplain && <p className="type-data text-[11px] text-st-review">On paper: {step.selfExplain}</p>}
                  </div>
                ))}
              </div>
            </details>
          )}

          {concept.derivation.length > 0 && (
            <div className="paper-sheet space-y-4 p-5">
              <h3 className="type-display text-base text-ink">Derive it from first principles</h3>
              <p className="type-data text-[11px] text-pencil">
                Co-produce each step on your paper — attempt it, then reveal. This is the difference between understanding a
                result and just using a formula.
              </p>
              {concept.derivation.map((step, i) => (
                <PaperReveal key={i} prompt={step.prompt} model={step.answer} doneLabel="Show this step" />
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
            <Button onClick={goNext} className="bg-ballpoint text-paper hover:bg-ballpoint/90">{concept.generative.length ? "Generate →" : "Practice →"}</Button>
          </div>
        </div>
      )}

      {/* GENERATE — varied generative acts on the student's own paper */}
      {current === "Generate" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="type-display text-base text-ink">Make it yours</h3>
            <p className="type-data text-[11px] text-pencil">
              Do each on your paper — generating it yourself is what builds understanding. Then compare with the model.
            </p>
          </div>
          {concept.generative.map((g, i) => (
            <PaperReveal key={i} kicker={g.kind} prompt={g.prompt} model={g.model} />
          ))}
          <div className="flex justify-end">
            <Button onClick={goNext} className="bg-ballpoint text-paper hover:bg-ballpoint/90">Practice →</Button>
          </div>
        </div>
      )}

      {/* CHECK — predict, then auto-graded checks; calibrate against the first */}
      {current === "Check" && (
        <div className="space-y-4">
          <div className="paper-sheet space-y-4 p-5">
            <h3 className="type-display text-base text-ink">Prove you’ve got it</h3>
            {concept.checks.length === 0 ? (
              <p className="text-sm text-pencil">No checks were generated for this concept.</p>
            ) : (
              <>
                {predicted === null && (
                  <div className="rounded-md border border-rule bg-secondary/20 p-3">
                    <Calibrate value={predicted} onChange={setPredicted} />
                  </div>
                )}
                {concept.checks.map((c, i) => (
                  <AutoCheckCard
                    key={i}
                    check={c}
                    onScored={(score) => {
                      onStruggleDelta(score === 2 ? -1 : score === 0 ? 1 : 0);
                      if (i === 0 && predicted !== null && !calibRecorded.current) {
                        calibRecorded.current = true;
                        onCalibration(predicted, score);
                      }
                    }}
                  />
                ))}
              </>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={goNext} className="bg-ballpoint text-paper hover:bg-ballpoint/90">Teach it back →</Button>
          </div>
        </div>
      )}

      {/* TEACH BACK — protégé effect; explain on paper, self-assess against a checklist */}
      {current === "Teach back" && (
        <div className="paper-sheet space-y-4 p-5">
          <h3 className="type-display text-base text-ink">Teach it back</h3>
          <p className="type-data text-[11px] text-pencil">
            Explain it aloud or on your paper as if teaching someone — the surest test of real understanding. Then tick what
            you covered. (You can also paste your explanation into your own AI and ask it to critique you.)
          </p>
          {concept.teachBack?.whatToExplain && <Md text={concept.teachBack.whatToExplain} className="text-sm text-ink" />}
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
            <Button onClick={onDone} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
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
  // Live-performance signal for guidance fading — persists across concepts.
  const [struggle, setStruggle] = useState(0);
  const onStruggleDelta = (d: number) => setStruggle((s) => Math.max(-3, Math.min(3, s + d)));

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
            For each idea you’ll attempt a pretest on paper, study a worked reveal, make it yours, prove it on quick
            auto-graded checks, and teach it back. A concept counts as understood only when you can produce it — not when it
            feels familiar.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setView(advanceFrom(view))} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              {lesson.prerequisites.length ? "Check prerequisites →" : "Begin →"}
            </Button>
          </div>
        </div>
      )}

      {/* PREREQS — diagnostic gate with just-in-time refreshers */}
      {view.kind === "prereqs" && (
        <div className="space-y-4">
          <SectionHead kicker="Foundations first" title="Quick prerequisite check" />
          <p className="text-sm text-pencil">
            Let’s measure the ground before we build. Answer each — if one’s shaky, a quick refresher shores it up before we
            rely on it.
          </p>
          {lesson.prerequisites.map((p, i) => (
            <PrereqGate key={i} prereq={p} />
          ))}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                onProgress({ ...progress, prereqsDone: true });
                setView(advanceFrom(view));
              }}
              className="bg-ballpoint text-paper hover:bg-ballpoint/90"
            >
              Start the lesson →
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
          struggle={struggle}
          onStruggleDelta={onStruggleDelta}
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

      {/* INTERLEAVE — name the concept, then solve (on paper), then compare */}
      {view.kind === "interleave" && (
        <div className="space-y-4">
          <SectionHead kicker="Mix it up" title="Interleaved practice" />
          <p className="text-sm text-pencil">
            These mix the chapter’s concepts. The hard part of a real exam is working out <em>which</em> idea applies — so on
            your paper, name it first, then solve.
          </p>
          {lesson.interleaved.map((q, i) => (
            <PaperReveal
              key={i}
              prompt={q.prompt}
              model={`${q.whichConcept ? `_Concept tested: ${q.whichConcept}_\n\n` : ""}${q.modelAnswer}`}
              doneLabel="I’ve named it and solved it — reveal"
            />
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
            <PaperReveal key={i} prompt={q.question} model={q.modelAnswer} />
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
            You pretested, studied the reveals, generated your own understanding, proved it, and taught back{" "}
            {progress.doneConceptIds.length} concept{progress.doneConceptIds.length === 1 ? "" : "s"}. That’s understanding
            you produced — not just recognised.
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

/* --------------------------- calibration summary ------------------------- */

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
          ({rows.length} check{rows.length === 1 ? "" : "s"}). Closing this gap is how you stop the fluency illusion fooling
          you.
        </span>
      </p>
    </div>
  );
}
