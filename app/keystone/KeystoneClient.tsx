"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Questionnaire from "./Questionnaire";
import LessonPlayer from "./LessonPlayer";
import { buildLearningPrompt } from "@/lib/keystone/prompt";
import type { KeystoneAnswers } from "@/lib/keystone/questionnaire";
import { parseLessonText, validateLesson, type KLesson } from "@/lib/keystone/schema";
import {
  loadAnswers,
  saveAnswers,
  loadLesson,
  saveLesson,
  loadProgress,
  saveProgress,
  emptyProgress,
  clearLesson,
  clearAll,
  type KProgress,
} from "@/lib/keystone/storage";

type Step = "intro" | "questionnaire" | "prompt" | "paste" | "lesson";

export default function KeystoneClient() {
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<KeystoneAnswers>({});
  const [lesson, setLesson] = useState<KLesson | null>(null);
  const [progress, setProgress] = useState<KProgress | null>(null);
  const [resumable, setResumable] = useState<KLesson | null>(null);

  // paste step state
  const [raw, setRaw] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Hydrate from localStorage once.
  useEffect(() => {
    const a = loadAnswers();
    if (a) setAnswers(a);
    const l = loadLesson();
    if (l) setResumable(l);
  }, []);

  const prompt = useMemo(() => buildLearningPrompt(answers), [answers]);

  function setField(id: string, value: string | string[]) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      saveAnswers(next);
      return next;
    });
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — textarea is selectable */
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(setRaw);
  }

  function tryBuildLesson() {
    setParseError(null);
    setMissing([]);
    setWarnings([]);
    const parsed = parseLessonText(raw);
    if (!parsed.ok) {
      setParseError(parsed.error);
      return;
    }
    const result = validateLesson(parsed.data);
    if (!result.ok || !result.lesson) {
      setParseError("That JSON didn’t contain a usable lesson.");
      setMissing(result.missing);
      return;
    }
    setWarnings(result.warnings);
    setLesson(result.lesson);
    saveLesson(result.lesson);
    const p = emptyProgress(result.lesson.title);
    setProgress(p);
    saveProgress(p);
    setStep("lesson");
  }

  function resume() {
    if (!resumable) return;
    setLesson(resumable);
    setProgress(loadProgress() ?? emptyProgress(resumable.title));
    setStep("lesson");
  }

  function restart() {
    clearLesson();
    setLesson(null);
    setProgress(null);
    setResumable(null);
    setRaw("");
    setStep("intro");
  }

  function onProgress(p: KProgress) {
    setProgress(p);
    saveProgress(p);
  }

  /* ------------------------------- lesson ------------------------------- */
  if (step === "lesson" && lesson && progress) {
    return (
      <LessonPlayer lesson={lesson} progress={progress} onProgress={onProgress} onRestart={restart} />
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="type-display text-3xl text-ink">Keystone</h1>
        <p className="text-sm text-pencil">
          Understand it — don’t just memorize it. Keystone builds a personalized lesson <em>prompt</em> for the AI you
          already use; you run it on your own chapter, paste the result back, and it becomes an interactive,
          science-based lesson. <strong className="text-ink">No API key. Your chapter never leaves your AI.</strong>
        </p>
      </div>

      {/* Resume banner */}
      {resumable && step === "intro" && (
        <div className="paper-sheet flex items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink">
            Resume <span className="type-display">“{resumable.title}”</span>?
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { clearLesson(); setResumable(null); }} className="text-pencil">
              Discard
            </Button>
            <Button size="sm" onClick={resume} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              Resume →
            </Button>
          </div>
        </div>
      )}

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {(["questionnaire", "prompt", "paste"] as const).map((s, i) => {
          const labels = { questionnaire: "Personalize", prompt: "Copy prompt", paste: "Paste lesson" };
          const active = step === s;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`type-data flex h-6 w-6 items-center justify-center rounded-full ${
                  active ? "bg-ballpoint text-paper" : "border border-rule bg-paper text-pencil"
                }`}
              >
                {i + 1}
              </span>
              <span className={active ? "text-ink" : "text-pencil"}>{labels[s]}</span>
              {i < 2 && <span className="text-rule">—</span>}
            </li>
          );
        })}
      </ol>

      {/* INTRO — how it works */}
      {step === "intro" && (
        <div className="paper-sheet space-y-4 p-5">
          <h2 className="type-display text-lg text-ink">How it works</h2>
          <ol className="space-y-3 text-sm text-pencil">
            <li className="flex gap-3">
              <span className="type-data text-st-review">1</span>
              <span>
                <strong className="text-ink">Tell Keystone about you</strong> — a quick, tap-friendly questionnaire.
                Keystone compiles a precise, personalized prompt.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="type-data text-st-review">2</span>
              <span>
                <strong className="text-ink">Run it in your own AI</strong> (ChatGPT, Claude, Gemini…) together with
                your chapter. It returns one block of JSON.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="type-data text-st-review">3</span>
              <span>
                <strong className="text-ink">Paste it back</strong> — Keystone turns it into an interactive lesson:
                attempt before you’re taught, derive it yourself, prove you can transfer it, teach it back.
              </span>
            </li>
          </ol>
          <p className="type-data text-[11px] text-pencil">
            Keystone never calls an AI and holds no key. It’s a prompt compiler and a lesson player — the thinking
            happens in the model you already trust.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setStep("questionnaire")} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              Start →
            </Button>
          </div>
        </div>
      )}

      {/* QUESTIONNAIRE */}
      {step === "questionnaire" && (
        <Questionnaire
          answers={answers}
          setField={setField}
          onBack={() => setStep("intro")}
          onSubmit={() => setStep("prompt")}
        />
      )}

      {/* PROMPT */}
      {step === "prompt" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">Copy your lesson prompt</h2>
            <p className="text-sm text-pencil">
              Paste this into your AI tool, then add{" "}
              <strong className="text-ink">your chapter, notes, or PDF text</strong> where it says so at the bottom. It
              will reply with one JSON block — copy that for the next step.
            </p>
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={prompt}
              rows={14}
              className="w-full resize-none rounded-md border border-rule bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed text-ink focus:outline-none"
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
          <ul className="space-y-1 type-data text-[11px] text-pencil">
            <li>• A stronger model gives a better lesson. If your chapter is long, run it in parts and paste each result.</li>
            <li>• Math (LaTeX) is supported; images aren’t — diagrams are described in words.</li>
          </ul>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep("questionnaire")}>
              ← Edit answers
            </Button>
            <Button onClick={() => setStep("paste")} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
              I have my JSON → paste it
            </Button>
          </div>
        </div>
      )}

      {/* PASTE */}
      {step === "paste" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">Paste your lesson</h2>
            <p className="text-sm text-pencil">
              Paste what your AI returned, or upload a <code>.json</code>/<code>.txt</code>/<code>.md</code> file. If it
              cut off mid-output on a long chapter, paste the rest on the end and try again.
            </p>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={12}
            placeholder='{ "title": "…", "concepts": [ … ] }'
            className="w-full resize-y rounded-md border border-rule bg-paper p-3 font-mono text-xs text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
          />
          {parseError && <p className="text-sm text-redpen">{parseError}</p>}
          {missing.length > 0 && (
            <div className="rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
              <p className="type-data text-[11px] text-orange-600 dark:text-orange-400">Looks incomplete — missing:</p>
              <ul className="mt-1 space-y-0.5">
                {missing.map((m, i) => (
                  <li key={i} className="type-data text-[11px] text-pencil">• {m}</li>
                ))}
              </ul>
              <p className="type-data mt-2 text-[11px] text-pencil">
                Ask your AI to “continue the JSON from where it stopped”, paste the rest above, and try again.
              </p>
            </div>
          )}
          {warnings.length > 0 && (
            <ul className="space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i} className="type-data text-[11px] text-pencil">⚠ {w}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="type-data cursor-pointer text-xs text-ballpoint hover:underline">
              Upload a file
              <input type="file" accept=".json,.txt,.md,application/json,text/plain" onChange={onFile} className="hidden" />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("prompt")}>
                ← Back
              </Button>
              <Button onClick={tryBuildLesson} disabled={!raw.trim()} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                Build my lesson →
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Link href="/" className="type-data text-xs text-pencil hover:text-ink">
          ← Home
        </Link>
        {step !== "intro" && (
          <button onClick={() => { clearAll(); setAnswers({}); setStep("intro"); }} className="type-data text-xs text-pencil hover:text-redpen">
            Reset everything
          </button>
        )}
      </div>
    </div>
  );
}
