"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Md, SectionHead, AttemptBox } from "./primitives";
import { type KDoubt, validateDoubt, parseLessonText, kindLabel } from "@/lib/keystone/schema";
import { buildDoubtFollowupPrompt } from "@/lib/keystone/prompt";

type Phase = "method" | "check" | "stuck" | "done";

export default function DoubtPlayer({
  doubt: initialDoubt,
  confusion,
  onRestart,
}: {
  doubt: KDoubt;
  confusion: string;
  onRestart: () => void;
}) {
  const [doubt, setDoubt] = useState<KDoubt>(initialDoubt);
  const [idx, setIdx] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("method");

  // retrieval check
  const [checkAttempt, setCheckAttempt] = useState("");
  const [checkRevealed, setCheckRevealed] = useState(false);

  // "go deeper" iterative loop
  const [stillConfusing, setStillConfusing] = useState("");
  const [followupReady, setFollowupReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newRaw, setNewRaw] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const method = doubt.methods[idx];

  const followupPrompt = useMemo(
    () =>
      buildDoubtFollowupPrompt({
        concept: doubt.concept,
        confusion,
        triedMethods: tried,
        stillConfusing,
      }),
    [doubt.concept, confusion, tried, stillConfusing]
  );

  async function copyFollowup() {
    try {
      await navigator.clipboard.writeText(followupPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — textarea selectable */
    }
  }

  function clicked() {
    setPhase(doubt.retrievalCheck ? "check" : "done");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function notYet() {
    if (method) setTried((t) => [...t, kindLabel(method.kind)]);
    if (idx + 1 < doubt.methods.length) {
      setIdx((i) => i + 1);
    } else {
      setPhase("stuck");
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function loadDeeper() {
    setPasteError(null);
    const parsed = parseLessonText(newRaw);
    if (!parsed.ok) {
      setPasteError(parsed.error);
      return;
    }
    const v = validateDoubt(parsed.data);
    if (!v.ok || !v.doubt) {
      setPasteError("That JSON didn’t contain any explanations. Make sure you copied the whole block.");
      return;
    }
    setDoubt(v.doubt);
    setIdx(0);
    setTried([]);
    setStillConfusing("");
    setFollowupReady(false);
    setNewRaw("");
    setPhase("method");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="type-data text-[11px] uppercase tracking-wide text-st-review">Doubt — until it clicks</p>
          <h1 className="type-display text-2xl text-ink">{doubt.concept}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={onRestart} className="text-pencil">
          New doubt
        </Button>
      </div>

      {/* METHOD — one explanation at a time */}
      {phase === "method" && method && (
        <div className="space-y-4">
          <p className="type-data text-[11px] text-pencil">
            Angle {idx + 1} of {doubt.methods.length} · we’ll keep trying different ones until it lands.
          </p>
          <div className="paper-sheet space-y-3 p-5">
            <p className="type-data text-[11px] uppercase tracking-wide text-st-review">{kindLabel(method.kind)}</p>
            <h2 className="type-display text-lg text-ink">{method.title}</h2>
            <Md text={method.content} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={notYet} className="text-pencil">
              Still not clicking →
            </Button>
            <Button onClick={clicked} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              It clicked ✓
            </Button>
          </div>
        </div>
      )}

      {/* CHECK — confirm it really landed */}
      {phase === "check" && doubt.retrievalCheck && (
        <div className="paper-sheet space-y-3 p-5">
          <SectionHead kicker="Quick check" title="Prove it clicked" />
          <Md text={doubt.retrievalCheck.question} />
          {!checkRevealed ? (
            <>
              <AttemptBox value={checkAttempt} onChange={setCheckAttempt} rows={3} />
              <Button size="sm" onClick={() => setCheckRevealed(true)} disabled={checkAttempt.trim().length < 1} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                Check
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-st-answered/30 bg-st-answered/5 p-3">
                <p className="type-data text-[11px] text-st-answered">Model answer</p>
                <Md text={doubt.retrievalCheck.modelAnswer || "—"} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPhase("stuck")} className="text-pencil">
                  Hmm, still shaky →
                </Button>
                <Button onClick={() => setPhase("done")} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                  Got it ✓
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUCK — the iterative deeper-prompt loop */}
      {phase === "stuck" && (
        <div className="paper-sheet space-y-4 p-5">
          <SectionHead kicker="Still stuck — go deeper" title="Let’s attack it again" />
          <p className="text-sm text-pencil">
            None of those landed yet. Tell me what’s <em>still</em> confusing, and we’ll compile a deeper, more
            targeted prompt for your AI — informed by which angles didn’t work. This is the loop that recovers what a
            live tutor does.
          </p>
          <AttemptBox
            value={stillConfusing}
            onChange={setStillConfusing}
            rows={3}
            placeholder="What part is still not making sense?"
          />
          {!followupReady ? (
            <div className="flex justify-end">
              <Button
                onClick={() => setFollowupReady(true)}
                disabled={stillConfusing.trim().length < 1}
                className="bg-ballpoint text-paper hover:bg-ballpoint/90"
              >
                Compile a deeper prompt →
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  readOnly
                  value={followupPrompt}
                  rows={8}
                  className="w-full resize-none rounded-md border border-rule bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed text-ink focus:outline-none"
                />
                <Button type="button" size="sm" onClick={copyFollowup} className="absolute right-2 top-2 bg-ballpoint text-paper hover:bg-ballpoint/90">
                  {copied ? "Copied ✓" : "Copy"}
                </Button>
              </div>
              <p className="type-data text-[11px] text-pencil">Run that in your AI, then paste the new explanations:</p>
              <textarea
                value={newRaw}
                onChange={(e) => setNewRaw(e.target.value)}
                rows={6}
                placeholder='{ "concept": "…", "methods": [ … ] }'
                className="w-full resize-y rounded-md border border-rule bg-paper p-3 font-mono text-xs text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
              />
              {pasteError && <p className="text-sm text-redpen">{pasteError}</p>}
              <div className="flex justify-end">
                <Button onClick={loadDeeper} disabled={!newRaw.trim()} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                  Try these new angles →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="paper-sheet space-y-4 p-5">
          <SectionHead kicker="It clicked" title="That’s the one 🎉" />
          <p className="text-sm text-pencil">
            That’s the click — real understanding, not a memorized line. Head back to what you were studying while it’s
            fresh.
          </p>
          <div className="flex justify-end">
            <Button onClick={onRestart} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
