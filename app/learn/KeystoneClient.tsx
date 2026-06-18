"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Questionnaire from "./Questionnaire";
import LessonPlayer from "./LessonPlayer";
import RevisionPlayer from "./RevisionPlayer";
import DoubtPlayer from "./DoubtPlayer";
import { buildLearningPrompt, buildRevisionPrompt, buildDoubtPrompt } from "@/lib/keystone/prompt";
import { str, arr, type KeystoneAnswers } from "@/lib/keystone/questionnaire";
import {
  parseLessonText,
  validateLesson,
  validateRevision,
  validateDoubt,
  type KLesson,
  type KRevisionBank,
  type KDoubt,
} from "@/lib/keystone/schema";
import { SAMPLE_LESSON_JSON, SAMPLE_REVISION_JSON, SAMPLE_DOUBT_JSON } from "@/lib/keystone/sample";
import {
  loadAnswers,
  saveAnswers,
  emptyProgress,
  normalizeProgress,
  clearAll,
  listLibrary,
  getLibraryItem,
  upsertLibraryItem,
  removeLibraryItem,
  mergeRemoteItems,
  markStudied,
  isDue,
  newId,
  type KLibraryItem,
  type KProgress,
} from "@/lib/keystone/storage";
import { fetchRemoteItems, pushRemoteItem, deleteRemoteItem } from "@/lib/keystone/sync";

type Mode = "learning" | "revision" | "doubt";
type Step = "intro" | "questionnaire" | "doubtinput" | "prompt" | "paste" | "play";

const MODES: { id: Mode; title: string; tagline: string }[] = [
  { id: "learning", title: "Study a chapter", tagline: "Build deep understanding of new material, concept by concept." },
  { id: "revision", title: "Revise for an exam", tagline: "Turn what you've learned into durable, exam-ready recall." },
  { id: "doubt", title: "Clear a doubt", tagline: "Stuck on one concept? Attack it from every angle until it clicks." },
];

function dueLabel(it: KLibraryItem): { text: string; due: boolean } {
  if (it.lastStudiedAt === null) return { text: "Not started", due: true };
  if (isDue(it)) return { text: "Due for review", due: true };
  const days = Math.max(1, Math.round(((it.dueAt ?? 0) - Date.now()) / (24 * 60 * 60 * 1000)));
  return { text: `Next review in ${days}d`, due: false };
}

export default function KeystoneClient() {
  const [step, setStep] = useState<Step>("intro");
  const [mode, setMode] = useState<Mode>("learning");
  const [answers, setAnswers] = useState<KeystoneAnswers>({});

  const [doubtConcept, setDoubtConcept] = useState("");
  const [doubtConfusion, setDoubtConfusion] = useState("");

  // active run
  const [lesson, setLesson] = useState<KLesson | null>(null);
  const [progress, setProgress] = useState<KProgress | null>(null);
  const [bank, setBank] = useState<KRevisionBank | null>(null);
  const [doubt, setDoubt] = useState<KDoubt | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // the shelf
  const [library, setLibrary] = useState<KLibraryItem[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  // Which shelf item is mid-delete (two-step confirm so a tap can't wipe a lesson by accident).
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // paste step
  const [raw, setRaw] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = loadAnswers();
    if (a) setAnswers(a);
    setLibrary(listLibrary());
    // Cloud sync — signed-in only; fails soft for guests / un-migrated DB.
    (async () => {
      const remote = await fetchRemoteItems();
      if (!remote.signedIn) return;
      setSignedIn(true);
      // Last-writer-wins merge; push only the items whose local copy is newer.
      const toPush = mergeRemoteItems(remote.items);
      toPush.forEach((id) => { const it = getLibraryItem(id); if (it) pushRemoteItem(it); });
      setLibrary(listLibrary());
    })();
  }, []);

  const prompt = useMemo(() => {
    if (mode === "revision") return buildRevisionPrompt(answers);
    if (mode === "doubt") {
      const interests = [...arr(answers, "interests"), str(answers, "interestsOther")].filter(Boolean).join(", ");
      return buildDoubtPrompt({ concept: doubtConcept, confusion: doubtConfusion, interests });
    }
    return buildLearningPrompt(answers);
  }, [mode, answers, doubtConcept, doubtConfusion]);

  const sampleFor = mode === "revision" ? SAMPLE_REVISION_JSON : mode === "doubt" ? SAMPLE_DOUBT_JSON : SAMPLE_LESSON_JSON;

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
      /* clipboard blocked */
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(setRaw);
  }

  function resetPaste() {
    setParseError(null);
    setMissing([]);
    setWarnings([]);
  }

  function shelve(mode: "learning" | "revision", data: KLesson | KRevisionBank, prog: KProgress | null): string {
    const id = newId();
    const item: KLibraryItem = {
      id,
      mode,
      title: data.title,
      subject: data.subject,
      createdAt: Date.now(),
      lastStudiedAt: null,
      dueAt: null,
      reviewCount: 0,
      data,
      progress: prog,
      updatedAt: Date.now(),
    };
    upsertLibraryItem(item);
    if (signedIn) pushRemoteItem(item);
    setLibrary(listLibrary());
    return id;
  }

  function tryBuild() {
    resetPaste();
    const parsed = parseLessonText(raw);
    if (!parsed.ok) {
      setParseError(parsed.error);
      return;
    }
    if (mode === "revision") {
      const r = validateRevision(parsed.data);
      if (!r.ok || !r.bank) {
        setParseError("That JSON didn’t contain a usable question set.");
        setMissing(r.missing);
        return;
      }
      setWarnings(r.warnings);
      setBank(r.bank);
      setActiveId(shelve("revision", r.bank, null));
      setStep("play");
      return;
    }
    if (mode === "doubt") {
      const r = validateDoubt(parsed.data);
      if (!r.ok || !r.doubt) {
        setParseError("That JSON didn’t contain any explanations.");
        setMissing(r.missing);
        return;
      }
      setWarnings(r.warnings);
      setDoubt(r.doubt);
      setActiveId(null); // doubt is ephemeral — not shelved
      setStep("play");
      return;
    }
    const r = validateLesson(parsed.data);
    if (!r.ok || !r.lesson) {
      setParseError("That JSON didn’t contain a usable lesson.");
      setMissing(r.missing);
      return;
    }
    setWarnings(r.warnings);
    const p = emptyProgress(r.lesson.title);
    setLesson(r.lesson);
    setProgress(p);
    setActiveId(shelve("learning", r.lesson, p));
    setStep("play");
  }

  function resumeItem(it: KLibraryItem) {
    // Re-validate on load: shelf items (especially ones pulled from the cloud,
    // where `data` and `progress` are stored as opaque JSON) are normalized
    // through the SAME validators as a fresh paste before they drive the player —
    // a malformed or crafted blob can't break it. Validation is idempotent on
    // already-normalized data, so a healthy item round-trips unchanged. The `!v.ok`
    // guard mirrors the paste path (tryBuild): a thin lesson / 0-question bank is
    // rejected here too rather than opening into an empty / falsely-"mastered"
    // player. Only commit the navigation state once it validates.
    if (it.mode === "learning") {
      const v = validateLesson(it.data);
      if (!v.ok || !v.lesson) return; // unusable — leave it on the shelf
      setLesson(v.lesson);
      // progress is untrusted too — coerce it so the player's array derefs are safe.
      setProgress(normalizeProgress(it.progress, v.lesson.title));
    } else {
      const v = validateRevision(it.data);
      if (!v.ok || !v.bank) return;
      setBank(v.bank);
    }
    setActiveId(it.id);
    setMode(it.mode);
    setStep("play");
  }

  function removeItem(id: string) {
    removeLibraryItem(id);
    if (signedIn) deleteRemoteItem(id);
    setLibrary(listLibrary());
  }

  /** LessonPlayer progress → sync into the shelf; advance the schedule on first completion. */
  function onLessonProgress(p: KProgress) {
    setProgress(p);
    if (!activeId) return;
    const it = getLibraryItem(activeId);
    if (!it) return;
    upsertLibraryItem({ ...it, progress: p });
    const lessonData = it.data as KLesson;
    const total = Array.isArray(lessonData.concepts) ? lessonData.concepts.length : 0;
    const complete = total > 0 && p.doneConceptIds.length >= total;
    if (complete && it.dueAt === null) markStudied(activeId);
    if (signedIn) {
      const updated = getLibraryItem(activeId);
      if (updated) pushRemoteItem(updated);
    }
    setLibrary(listLibrary());
  }

  function onRevisionMastered() {
    if (activeId) {
      markStudied(activeId);
      if (signedIn) {
        const updated = getLibraryItem(activeId);
        if (updated) pushRemoteItem(updated);
      }
      setLibrary(listLibrary());
    }
  }

  function exitToShelf() {
    setLesson(null);
    setProgress(null);
    setBank(null);
    setDoubt(null);
    setActiveId(null);
    setRaw("");
    resetPaste();
    setLibrary(listLibrary());
    setStep("intro");
  }

  function pickMode(m: Mode) {
    setMode(m);
    setRaw("");
    resetPaste();
    setStep(m === "doubt" ? "doubtinput" : "questionnaire");
  }

  /* ------------------------------- players ------------------------------ */
  if (step === "play") {
    if (mode === "learning" && lesson && progress) {
      return <LessonPlayer lesson={lesson} progress={progress} onProgress={onLessonProgress} onRestart={exitToShelf} />;
    }
    if (mode === "revision" && bank) {
      return <RevisionPlayer bank={bank} itemId={activeId ?? ""} onRestart={exitToShelf} onMastered={onRevisionMastered} />;
    }
    if (mode === "doubt" && doubt) {
      return <DoubtPlayer doubt={doubt} confusion={doubtConfusion} onRestart={exitToShelf} />;
    }
  }

  const modeLabel = MODES.find((m) => m.id === mode)?.title ?? "";

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="type-display text-3xl text-ink">Learn</h1>
        <p className="text-sm text-pencil">
          Understand it — don’t just memorize it. It builds a personalized <em>prompt</em> for the AI you already
          use; you run it on your own material, paste the result back, and it becomes an interactive, science-based
          lesson. <strong className="text-ink">No API key. Your material never leaves your AI.</strong>
        </p>
      </div>

      {/* Stepper (hidden on intro) */}
      {step !== "intro" && (
        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {(mode === "doubt" ? (["doubtinput", "prompt", "paste"] as Step[]) : (["questionnaire", "prompt", "paste"] as Step[])).map((s, i) => {
            const labels: Record<string, string> = { questionnaire: "Personalize", doubtinput: "Your doubt", prompt: "Copy prompt", paste: mode === "doubt" ? "Paste answer" : "Paste lesson" };
            const active = step === s;
            return (
              <li key={s} className="flex items-center gap-2">
                <span className={`type-data flex h-6 w-6 items-center justify-center rounded-full ${active ? "bg-ballpoint text-paper" : "border border-rule bg-paper text-pencil"}`}>{i + 1}</span>
                <span className={active ? "text-ink" : "text-pencil"}>{labels[s]}</span>
                {i < 2 && <span className="text-rule">—</span>}
              </li>
            );
          })}
        </ol>
      )}

      {/* INTRO — shelf + mode picker */}
      {step === "intro" && (
        <div className="space-y-5">
          {library.length > 0 && (
            <section className="space-y-2">
              <h2 className="type-display text-base text-ink">Your shelf</h2>
              <div className="space-y-2">
                {library.map((it) => {
                  const d = dueLabel(it);
                  // Defensive reads: a malformed/crafted shelf item must not throw
                  // here, or it would white-screen the whole shelf (this runs for
                  // every item). Optional-chain `data` (null/non-object → undefined)
                  // and fall back to 0 when `concepts` isn't an array.
                  const concepts = (it.data as KLesson | null)?.concepts;
                  const conceptTotal = Array.isArray(concepts) ? concepts.length : 0;
                  const doneCount = Array.isArray(it.progress?.doneConceptIds) ? it.progress.doneConceptIds.length : 0;
                  const done = it.mode === "learning" && it.progress
                    ? `${doneCount}/${conceptTotal} concepts`
                    : it.mode === "revision"
                    ? "revision set"
                    : "";
                  return (
                    <div key={it.id} className="paper-sheet flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="type-data truncate text-sm text-ink">{it.title}</span>
                          <span className="type-data rounded border border-rule px-1 py-0.5 text-[10px] uppercase text-pencil">{it.mode}</span>
                        </div>
                        <p className="type-data text-[11px] text-pencil">
                          {it.subject ? `${it.subject} · ` : ""}{done}
                          {" · "}
                          <span className={d.due ? "text-st-review" : "text-pencil"}>{d.text}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {confirmingDeleteId === it.id ? (
                          <>
                            <span className="type-data text-[11px] text-pencil">Delete this?</span>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmingDeleteId(null)} className="text-pencil">
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                removeItem(it.id);
                                setConfirmingDeleteId(null);
                              }}
                              className="bg-redpen text-paper hover:bg-redpen/90"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => resumeItem(it)} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
                              {it.lastStudiedAt ? "Review" : "Resume"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmingDeleteId(it.id)}
                              aria-label={`Delete ${it.title}`}
                              className="text-pencil hover:bg-redpen/10 hover:text-redpen"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="type-display text-base text-ink">{library.length > 0 ? "Start something new" : "What do you want to do?"}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button key={m.id} type="button" onClick={() => pickMode(m.id)} className="paper-sheet space-y-1.5 p-4 text-left transition hover:border-ballpoint/50">
                  <div className="flex items-center gap-2">
                    <h3 className="type-display text-base text-ink">{m.title}</h3>
                  </div>
                  <p className="type-data text-[11px] text-pencil">{m.tagline}</p>
                  <span className="type-data text-[11px] text-ballpoint">Start →</span>
                </button>
              ))}
            </div>
          </section>

          <p className="type-data text-[11px] text-pencil">
            This tool never calls an AI and holds no key. It compiles the prompt and plays the lesson — the thinking
            happens in the model you already trust. Your shelf and progress are saved on this device.
          </p>
        </div>
      )}

      {step === "questionnaire" && (
        <Questionnaire
          answers={answers}
          setField={setField}
          onBack={() => setStep("intro")}
          onSubmit={() => setStep("prompt")}
          mode={mode === "revision" ? "revision" : "learning"}
        />
      )}

      {step === "doubtinput" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">What are you stuck on?</h2>
            <p className="text-sm text-pencil">
              Name the one concept, and say what about it isn’t clicking. It compiles a prompt that attacks it from
              many angles — and if the first round doesn’t land, it goes deeper.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm text-ink">The concept</label>
            <input value={doubtConcept} onChange={(e) => setDoubtConcept(e.target.value)} placeholder="e.g. Why entropy always increases" className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm text-ink">What’s confusing about it? <span className="type-data text-[11px] text-pencil">(optional but helps a lot)</span></label>
            <textarea value={doubtConfusion} onChange={(e) => setDoubtConfusion(e.target.value)} rows={3} placeholder="e.g. I don't see why it can't decrease locally…" className="w-full resize-y rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40" />
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep("intro")}>← Back</Button>
            <Button onClick={() => setStep("prompt")} disabled={doubtConcept.trim().length < 2} className="bg-ballpoint text-paper hover:bg-ballpoint/90">Compile my prompt →</Button>
          </div>
        </div>
      )}

      {step === "prompt" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">Copy your {modeLabel.toLowerCase()} prompt</h2>
            <p className="text-sm text-pencil">Paste this into your AI tool{mode === "doubt" ? "" : ", then add your chapter/notes where it says so at the bottom"}. It returns one JSON block — copy that for the next step.</p>
          </div>
          <div className="relative">
            <textarea readOnly value={prompt} rows={14} className="w-full resize-none rounded-md border border-rule bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed text-ink focus:outline-none" />
            <Button type="button" size="sm" onClick={copyPrompt} className="absolute right-2 top-2 bg-ballpoint text-paper hover:bg-ballpoint/90">{copied ? "Copied ✓" : "Copy prompt"}</Button>
          </div>
          <ul className="space-y-1 type-data text-[11px] text-pencil">
            <li>• A stronger model gives a better result. For long material, run it in parts and paste each result.</li>
            <li>• Math (LaTeX) is supported; images aren’t — diagrams are described in words.</li>
          </ul>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(mode === "doubt" ? "doubtinput" : "questionnaire")}>← Edit</Button>
            <Button onClick={() => setStep("paste")} className="bg-ballpoint text-paper hover:bg-ballpoint/90">I have my JSON → paste it</Button>
          </div>
        </div>
      )}

      {step === "paste" && (
        <div className="paper-sheet space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="type-display text-lg text-ink">Paste what your AI returned</h2>
            <p className="text-sm text-pencil">Paste the JSON, or upload a <code>.json</code>/<code>.txt</code>/<code>.md</code> file. If it cut off on long material, paste the rest on the end and try again.</p>
          </div>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={12} placeholder='{ … }' className="w-full resize-y rounded-md border border-rule bg-paper p-3 font-mono text-xs text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40" />
          {parseError && <p className="text-sm text-redpen">{parseError}</p>}
          {missing.length > 0 && (
            <div className="rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
              <p className="type-data text-[11px] text-orange-600 dark:text-orange-400">Looks incomplete — missing:</p>
              <ul className="mt-1 space-y-0.5">{missing.map((m, i) => (<li key={i} className="type-data text-[11px] text-pencil">• {m}</li>))}</ul>
              <p className="type-data mt-2 text-[11px] text-pencil">Ask your AI to “continue the JSON from where it stopped”, paste the rest, and try again.</p>
            </div>
          )}
          {warnings.length > 0 && <ul className="space-y-0.5">{warnings.map((w, i) => (<li key={i} className="type-data text-[11px] text-pencil">⚠ {w}</li>))}</ul>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <label className="type-data cursor-pointer text-xs text-ballpoint hover:underline">
                Upload a file
                <input type="file" accept=".json,.txt,.md,application/json,text/plain" onChange={onFile} className="hidden" />
              </label>
              <button type="button" onClick={() => { setRaw(sampleFor); resetPaste(); }} className="type-data text-xs text-pencil hover:text-ink hover:underline">Try a sample</button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("prompt")}>← Back</Button>
              <Button onClick={tryBuild} disabled={!raw.trim()} className="bg-ballpoint text-paper hover:bg-ballpoint/90">{mode === "doubt" ? "Explain it →" : "Build it →"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Link href="/" className="type-data text-xs text-pencil hover:text-ink">← Home</Link>
        {step !== "intro" ? (
          <button onClick={() => setStep("intro")} className="type-data text-xs text-pencil hover:text-ink">Cancel</button>
        ) : (
          library.length > 0 && (
            <button onClick={() => { listLibrary().forEach((it) => { removeLibraryItem(it.id); if (signedIn) deleteRemoteItem(it.id); }); clearAll(); setAnswers({}); setLibrary([]); }} className="type-data text-xs text-pencil hover:text-redpen">
              Clear shelf
            </button>
          )
        )}
      </div>
    </div>
  );
}
