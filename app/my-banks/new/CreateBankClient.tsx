"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";
import { normalizeQuestion, displayCorrectAnswer } from "@/lib/exam-helpers";
import { buildImportPrompt } from "@/lib/userbank/prompt";
import {
  parseImportText,
  validateBankImport,
  type NormalizedBankQuestion,
  type ValidatedBank,
} from "@/lib/userbank/schema";

type Step = "prompt" | "paste" | "review";

const letter = (i: number) => String.fromCharCode(65 + i);

function QuestionPreview({ q, num }: { q: NormalizedBankQuestion; num: number }) {
  const normalized = useMemo(() => normalizeQuestion(q), [q]);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="type-data text-xs text-pencil">Q{num}</span>
        <span className="type-data rounded border border-st-review/30 bg-st-review/10 px-1.5 py-0.5 text-[11px] text-st-review">
          {q.type}
        </span>
        {q.topic && <span className="type-data text-[11px] text-pencil">{q.topic}</span>}
      </div>
      <div className="text-sm text-ink">
        <MathRenderer text={q.text} />
      </div>
      {q.options.length > 0 && (
        <ul className="space-y-1">
          {q.options.map((o, i) => (
            <li key={i} className="flex gap-2 text-sm text-pencil">
              <span className="type-data shrink-0">{letter(i)}.</span>
              <MathRenderer text={o} />
            </li>
          ))}
        </ul>
      )}
      {q.type !== "Subjective" && (
        <p className="type-data text-xs text-st-answered">Answer: {displayCorrectAnswer(normalized)}</p>
      )}
    </div>
  );
}

export default function CreateBankClient() {
  const router = useRouter();
  const prompt = useMemo(() => buildImportPrompt(), []);

  const [step, setStep] = useState<Step>("prompt");
  const [copied, setCopied] = useState(false);

  const [rawText, setRawText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [validated, setValidated] = useState<ValidatedBank | null>(null);
  const [kept, setKept] = useState<boolean[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaultMode, setDefaultMode] = useState<"BANK" | "EXAM">("BANK");
  const [examDurationMin, setExamDurationMin] = useState<number>(60);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked; the textarea is selectable as a fallback */
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setRawText);
  }

  function doReview() {
    setParseError(null);
    const parsed = parseImportText(rawText);
    if (!parsed.ok) {
      setParseError(parsed.error);
      return;
    }
    const result = validateBankImport(parsed.data);
    if (result.questions.length === 0) {
      setParseError("No usable questions were found in that JSON.");
      return;
    }
    setValidated(result);
    setKept(result.questions.map(() => true));
    setTitle(result.title);
    setDescription(result.description ?? "");
    setStep("review");
  }

  function warningFor(index: number): string | null {
    return validated?.warnings.find((w) => w.index === index)?.message ?? null;
  }

  const keptCount = kept.filter(Boolean).length;

  async function createBank() {
    if (!validated) return;
    if (!title.trim()) {
      setCreateError("Give your bank a title.");
      return;
    }
    const questions = validated.questions.filter((_, i) => kept[i]);
    if (questions.length === 0) {
      setCreateError("Keep at least one question.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/user-banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          defaultMode,
          examDurationMin: defaultMode === "EXAM" ? examDurationMin : null,
          questions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        router.push(`/my-banks/${data.id}?mode=${defaultMode.toLowerCase()}`);
        return;
      }
      setCreateError(data.error || "Couldn’t create the bank. Please try again.");
    } catch {
      setCreateError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link href="/my-banks" className="type-data text-xs text-pencil hover:text-ink">
          ← My banks
        </Link>
        <h1 className="type-display text-2xl text-ink sm:text-3xl">Create a bank</h1>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {(["prompt", "paste", "review"] as Step[]).map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full type-data ${
                step === s ? "bg-ballpoint text-paper" : "border border-rule bg-paper text-pencil"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === s ? "text-ink" : "text-pencil"}>
              {s === "prompt" ? "Get questions" : s === "paste" ? "Paste JSON" : "Review"}
            </span>
            {i < 2 && <span className="text-rule">—</span>}
          </li>
        ))}
      </ol>

      {/* Step 1 — prompt */}
      {step === "prompt" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">1. Turn your material into questions</h2>
            <p className="text-sm text-pencil">
              Copy the prompt below and paste it into your AI tool (ChatGPT, Claude, Gemini…)
              <strong className="text-ink"> together with your notes, chapter, or PDF text</strong>. It will reply with a
              block of JSON. Copy that JSON — you’ll paste it on the next step.
            </p>
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={prompt}
              rows={12}
              className="w-full resize-none rounded-md border border-rule bg-secondary/40 p-3 font-mono text-xs text-ink focus:outline-none"
            />
            <Button
              type="button"
              size="sm"
              onClick={copyPrompt}
              className="absolute right-2 top-2 bg-ballpoint text-paper hover:bg-ballpoint/90"
            >
              {copied ? "Copied ✓" : "Copy prompt"}
            </Button>
          </div>
          <p className="type-data text-xs text-pencil">
            Tip: math is supported (LaTeX), but images aren’t — diagrams will be described in words.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setStep("paste")} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              Next: paste your JSON →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — paste */}
      {step === "paste" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">2. Paste the JSON</h2>
            <p className="text-sm text-pencil">
              Paste what your AI tool returned, or upload a <code>.json</code>/<code>.txt</code>/<code>.md</code> file.
              We’ll check it before anything is saved.
            </p>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={12}
            placeholder='{ "title": "…", "questions": [ … ] }'
            className="w-full resize-none rounded-md border border-rule bg-paper p-3 font-mono text-xs text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
          />
          {parseError && <p className="text-sm text-redpen">{parseError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="type-data cursor-pointer text-xs text-ballpoint hover:underline">
              Upload a file
              <input type="file" accept=".json,.txt,.md,application/json,text/plain" onChange={onFile} className="hidden" />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("prompt")}>
                ← Back
              </Button>
              <Button onClick={doReview} disabled={!rawText.trim()} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                Review →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — review */}
      {step === "review" && validated && (
        <div className="space-y-4">
          <div className="paper-sheet space-y-4 p-5">
            <h2 className="type-display text-lg text-ink">3. Review &amp; save</h2>
            <div className="space-y-3">
              <div>
                <label className="type-data text-xs text-pencil">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                />
              </div>
              <div>
                <label className="type-data text-xs text-pencil">Description (optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                />
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="type-data text-xs text-pencil">Default mode</label>
                  <select
                    value={defaultMode}
                    onChange={(e) => setDefaultMode(e.target.value as "BANK" | "EXAM")}
                    className="mt-1 block rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                  >
                    <option value="BANK">Question bank (practice)</option>
                    <option value="EXAM">Mock exam (timed)</option>
                  </select>
                </div>
                {defaultMode === "EXAM" && (
                  <div>
                    <label className="type-data text-xs text-pencil">Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={examDurationMin}
                      onChange={(e) => setExamDurationMin(Number(e.target.value))}
                      className="mt-1 block w-24 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
                    />
                  </div>
                )}
              </div>
            </div>

            <p className="type-data text-xs text-pencil">
              {keptCount} of {validated.questions.length} question{validated.questions.length === 1 ? "" : "s"} selected
              {validated.warnings.length > 0 ? ` · ${validated.warnings.length} with warnings` : ""}
              {validated.droppedCount > 0 ? ` · ${validated.droppedCount} unusable item(s) skipped` : ""}
              {validated.truncated ? " · capped at 500" : ""}
            </p>

            {createError && <p className="text-sm text-redpen">{createError}</p>}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("paste")}>
                ← Back
              </Button>
              <Button onClick={createBank} disabled={creating} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                {creating ? "Creating…" : `Create bank (${keptCount})`}
              </Button>
            </div>
          </div>

          {/* Question list with keep/drop + warnings */}
          <div className="space-y-3">
            {validated.questions.map((q, i) => {
              const warning = warningFor(i);
              return (
                <div key={i} className={`paper-sheet p-4 ${kept[i] ? "" : "opacity-50"}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    {warning ? (
                      <span className="type-data rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[11px] text-orange-600 dark:text-orange-400">
                        ⚠ {warning}
                      </span>
                    ) : (
                      <span className="type-data text-[11px] text-st-answered">Looks good</span>
                    )}
                    <label className="type-data flex items-center gap-1.5 text-xs text-pencil">
                      <input
                        type="checkbox"
                        checked={kept[i]}
                        onChange={() => setKept((k) => k.map((v, j) => (j === i ? !v : v)))}
                      />
                      Include
                    </label>
                  </div>
                  <QuestionPreview q={q} num={i + 1} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
