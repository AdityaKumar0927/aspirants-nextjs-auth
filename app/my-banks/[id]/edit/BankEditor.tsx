"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";
import { EXAM_QUESTION_TYPES, type ExamQuestionType } from "@/lib/exam-helpers";
import { answerWarning, MAX_BANK_QUESTIONS } from "@/lib/userbank/schema";
import type { Bank, BankQuestion } from "../types";

interface EditOption {
  _k: number;
  text: string;
  correct: boolean;
}
interface EditQ {
  _k: number;
  id?: string;
  text: string;
  type: ExamQuestionType;
  options: EditOption[];
  answerText: string;
  answerMin: number | null;
  answerMax: number | null;
  explanation: string;
  markscheme: string;
  subject: string;
  topic: string;
  difficulty: string;
  marks: number | null;
  negMarks: number | null;
  /** Stored correct-option letters with no matching option (pre-existing data). */
  orphanKeys?: string[];
}

const letter = (i: number) => String.fromCharCode(65 + i);
let keySeq = 1;

function toEdit(q: BankQuestion): EditQ {
  const correct = new Set<string>();
  if (q.correctOption) correct.add(q.correctOption.toUpperCase());
  for (const c of q.correctOptions || []) correct.add(String(c).toUpperCase());
  const options: EditOption[] = (q.options || []).map((text, i) => ({
    _k: keySeq++,
    text,
    correct: correct.has(letter(i)),
  }));
  const covered = new Set(options.map((_, i) => letter(i)));
  const orphanKeys = [...correct].filter((k) => !covered.has(k));
  return {
    _k: keySeq++,
    id: q.id,
    text: q.text || "",
    type: q.type,
    options,
    answerText: q.answerText ?? "",
    answerMin: q.answerMin,
    answerMax: q.answerMax,
    explanation: q.explanation ?? "",
    markscheme: q.markscheme ?? "",
    subject: q.subject ?? "",
    topic: q.topic ?? "",
    difficulty: q.difficulty ?? "",
    marks: q.marks,
    negMarks: q.negMarks,
    orphanKeys,
  };
}

function blankQ(): EditQ {
  return {
    _k: keySeq++,
    text: "",
    type: "Multiple Choice",
    options: [
      { _k: keySeq++, text: "", correct: true },
      { _k: keySeq++, text: "", correct: false },
      { _k: keySeq++, text: "", correct: false },
      { _k: keySeq++, text: "", correct: false },
    ],
    answerText: "",
    answerMin: null,
    answerMax: null,
    explanation: "",
    markscheme: "",
    subject: "",
    topic: "",
    difficulty: "",
    marks: null,
    negMarks: null,
  };
}

function toPayload(q: EditQ) {
  const isChoice = q.type === "Multiple Choice" || q.type === "Multiple Correct";
  const opts = q.options.filter((o) => o.text.trim());
  const correctLetters = opts.map((o, i) => (o.correct ? letter(i) : null)).filter(Boolean) as string[];
  const hasAnswerText = q.type === "Integer" || q.type === "Numerical" || q.type === "Fill Blanks" || q.type === "Subjective";
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    options: isChoice ? opts.map((o) => o.text.trim()) : [],
    correctOption: q.type === "Multiple Choice" ? correctLetters[0] ?? null : null,
    correctOptions: q.type === "Multiple Correct" ? correctLetters : [],
    answerText: hasAnswerText ? q.answerText.trim() || null : null,
    answerMin: q.type === "Numerical" ? q.answerMin : null,
    answerMax: q.type === "Numerical" ? q.answerMax : null,
    explanation: q.explanation.trim() || null,
    markscheme: q.markscheme.trim() || null,
    subject: q.subject.trim() || null,
    topic: q.topic.trim() || null,
    difficulty: q.difficulty.trim() || null,
    marks: q.marks,
    negMarks: q.negMarks,
  };
}

const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40";

function EditableQuestionCard({
  q,
  index,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  q: EditQ;
  index: number;
  total: number;
  onChange: (next: EditQ) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const set = (patch: Partial<EditQ>) => onChange({ ...q, ...patch });
  const isChoice = q.type === "Multiple Choice" || q.type === "Multiple Correct";
  const isNumeric = q.type === "Numerical";
  const hasAnswerText =
    q.type === "Integer" || q.type === "Numerical" || q.type === "Fill Blanks" || q.type === "Subjective";

  function setOption(i: number, patch: Partial<EditOption>) {
    set({ options: q.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });
  }
  function markCorrect(i: number) {
    if (q.type === "Multiple Choice") {
      set({ options: q.options.map((o, j) => ({ ...o, correct: j === i })) });
    } else {
      setOption(i, { correct: !q.options[i].correct });
    }
  }
  // Switching to single-choice: keep only the first marked option correct, so the
  // saved result and the rendered checkmarks match (no silent extra-key loss).
  function changeType(next: ExamQuestionType) {
    if (next === "Multiple Choice") {
      let seen = false;
      set({
        type: next,
        options: q.options.map((o) => {
          const keep = o.correct && !seen;
          if (o.correct) seen = true;
          return { ...o, correct: keep };
        }),
      });
    } else {
      set({ type: next });
    }
  }

  return (
    <div className="paper-sheet space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="type-data text-xs text-pencil">Q{index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} title="Move up" className="rounded p-1 text-pencil hover:text-ink disabled:opacity-30">↑</button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} title="Move down" className="rounded p-1 text-pencil hover:text-ink disabled:opacity-30">↓</button>
          <button type="button" onClick={() => setPreview((p) => !p)} className="type-data rounded px-1.5 py-1 text-xs text-pencil hover:text-ink">
            {preview ? "Edit" : "Preview"}
          </button>
          <button type="button" onClick={onDelete} className="type-data rounded px-1.5 py-1 text-xs text-redpen hover:underline">Delete</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={q.type}
          onChange={(e) => changeType(e.target.value as ExamQuestionType)}
          className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
        >
          {EXAM_QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input value={q.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Topic (optional)" className={`${inputCls} max-w-[12rem]`} />
        <input value={q.difficulty} onChange={(e) => set({ difficulty: e.target.value })} placeholder="Difficulty" className={`${inputCls} max-w-[8rem]`} />
      </div>

      {preview ? (
        <div className="rounded-md border border-rule bg-secondary/30 p-3 text-sm text-ink">
          <MathRenderer text={q.text || "_(empty)_"} />
        </div>
      ) : (
        <textarea value={q.text} onChange={(e) => set({ text: e.target.value })} rows={3} placeholder="Question text (Markdown + $LaTeX$)…" className={`${inputCls} resize-y`} />
      )}

      {isChoice && (
        <div className="space-y-2">
          {q.options.map((o, i) => (
            <div key={o._k} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markCorrect(i)}
                title={o.correct ? "Correct answer" : "Mark correct"}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border type-data text-xs ${
                  o.correct ? "border-st-answered bg-st-answered text-paper" : "border-rule bg-paper text-pencil"
                }`}
              >
                {o.correct ? "✓" : letter(i)}
              </button>
              <input value={o.text} onChange={(e) => setOption(i, { text: e.target.value })} placeholder={`Option ${letter(i)}`} className={inputCls} />
              <button
                type="button"
                onClick={() => set({ options: q.options.filter((_, j) => j !== i) })}
                disabled={q.options.length <= 2}
                className="type-data shrink-0 px-1 text-xs text-pencil hover:text-redpen disabled:opacity-30"
                title="Remove option"
              >
                ✕
              </button>
            </div>
          ))}
          {q.options.length < 10 && (
            <button type="button" onClick={() => set({ options: [...q.options, { _k: keySeq++, text: "", correct: false }] })} className="type-data text-xs text-ballpoint hover:underline">
              + Add option
            </button>
          )}
          <p className="type-data text-[11px] text-pencil">
            {q.type === "Multiple Choice" ? "Tap a tile to mark the one correct option." : "Tap tiles to mark all correct options."}
          </p>
          {q.orphanKeys && q.orphanKeys.length > 0 && (
            <p className="type-data text-[11px] text-redpen">
              Stored correct option {q.orphanKeys.join(", ")} has no matching choice — add or relabel an option and
              mark it correct, or this answer key will be cleared on save.
            </p>
          )}
        </div>
      )}

      {hasAnswerText && (
        <div className="space-y-2">
          {q.type === "Subjective" ? (
            <textarea value={q.answerText} onChange={(e) => set({ answerText: e.target.value })} rows={2} placeholder="Model answer (optional)" className={`${inputCls} resize-y`} />
          ) : (
            <input value={q.answerText} onChange={(e) => set({ answerText: e.target.value })} placeholder={q.type === "Integer" ? "Whole-number answer, e.g. 42" : q.type === "Fill Blanks" ? "Answer (comma-separate alternatives)" : "Exact answer (or use a range below)"} className={`${inputCls} max-w-sm`} />
          )}
          {isNumeric && (
            <div className="flex items-center gap-2">
              <input type="number" value={q.answerMin ?? ""} onChange={(e) => set({ answerMin: e.target.value === "" ? null : Number(e.target.value) })} placeholder="min" className={`${inputCls} max-w-[7rem]`} />
              <span className="type-data text-xs text-pencil">to</span>
              <input type="number" value={q.answerMax ?? ""} onChange={(e) => set({ answerMax: e.target.value === "" ? null : Number(e.target.value) })} placeholder="max" className={`${inputCls} max-w-[7rem]`} />
              <span className="type-data text-[11px] text-pencil">(optional accepted range)</span>
            </div>
          )}
        </div>
      )}

      <textarea value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} rows={2} placeholder="Explanation (optional)" className={`${inputCls} resize-y`} />
      <textarea value={q.markscheme} onChange={(e) => set({ markscheme: e.target.value })} rows={2} placeholder="Mark scheme (optional)" className={`${inputCls} resize-y`} />

      <div className="flex flex-wrap gap-3">
        <label className="type-data flex items-center gap-1 text-xs text-pencil">
          Marks
          <input type="number" value={q.marks ?? ""} onChange={(e) => set({ marks: e.target.value === "" ? null : Number(e.target.value) })} className={`${inputCls} w-20`} />
        </label>
        <label className="type-data flex items-center gap-1 text-xs text-pencil">
          Neg. marks
          <input type="number" value={q.negMarks ?? ""} onChange={(e) => set({ negMarks: e.target.value === "" ? null : Number(e.target.value) })} className={`${inputCls} w-20`} />
        </label>
      </div>
    </div>
  );
}

export default function BankEditor({ bankId }: { bankId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [defaultMode, setDefaultMode] = useState<"BANK" | "EXAM">("BANK");
  const [examDurationMin, setExamDurationMin] = useState(60);
  const [questions, setQuestions] = useState<EditQ[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/user-banks/${bankId}`);
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          const b: Bank = await res.json();
          setTitle(b.title);
          setDescription(b.description ?? "");
          setDefaultMode(b.defaultMode === "EXAM" ? "EXAM" : "BANK");
          setExamDurationMin(b.examDurationMin && b.examDurationMin > 0 ? b.examDurationMin : 60);
          setQuestions((b.questions || []).map(toEdit));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [bankId]);

  function updateQ(k: number, next: EditQ) {
    setQuestions((qs) => qs.map((q) => (q._k === k ? next : q)));
  }
  function moveQ(k: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const i = qs.findIndex((q) => q._k === k);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= qs.length) return qs;
      const next = [...qs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function deleteQ(k: number) {
    setQuestions((qs) => qs.filter((q) => q._k !== k));
  }

  async function save() {
    setError(null);
    if (!title.trim()) {
      setError("Give your bank a title.");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }
    if (questions.length > MAX_BANK_QUESTIONS) {
      setError(`A bank can hold at most ${MAX_BANK_QUESTIONS} questions.`);
      return;
    }
    const emptyIdx = questions.findIndex((q) => !q.text.trim());
    if (emptyIdx >= 0) {
      setError(`Question ${emptyIdx + 1} needs some text (or delete it).`);
      return;
    }
    const badRange = questions.findIndex(
      (q) => q.type === "Numerical" && q.answerMin != null && q.answerMax != null && q.answerMin > q.answerMax
    );
    if (badRange >= 0) {
      setError(`Question ${badRange + 1}: minimum must be ≤ maximum.`);
      return;
    }

    const payloads = questions.map(toPayload);
    const issues = payloads
      .map((p, i) => {
        const w = answerWarning(p);
        return w ? `Q${i + 1}: ${w}` : null;
      })
      .filter(Boolean) as string[];
    if (issues.length && !window.confirm(`Some questions may not be auto-gradable:\n\n${issues.join("\n")}\n\nSave anyway?`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/user-banks/${bankId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          defaultMode,
          examDurationMin: defaultMode === "EXAM" ? examDurationMin : null,
          questions: payloads,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/my-banks/${bankId}`);
        return;
      }
      setError(data.error || "Couldn’t save your changes.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="paper-sheet w-full max-w-3xl p-8 text-center text-sm text-pencil">Loading…</div>;
  }
  if (notFound) {
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
    <div className="w-full max-w-2xl space-y-5">
      <div className="space-y-1">
        <Link href={`/my-banks/${bankId}`} className="type-data text-xs text-pencil hover:text-ink">
          ← Back to bank
        </Link>
        <h1 className="type-display text-2xl text-ink sm:text-3xl">Edit bank</h1>
      </div>

      {/* Meta */}
      <div className="paper-sheet space-y-3 p-5">
        <div>
          <label className="type-data text-xs text-pencil">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label className="type-data text-xs text-pencil">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="type-data text-xs text-pencil">Default mode</label>
            <select value={defaultMode} onChange={(e) => setDefaultMode(e.target.value as "BANK" | "EXAM")} className="mt-1 block rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40">
              <option value="BANK">Question bank (practice)</option>
              <option value="EXAM">Mock exam (timed)</option>
            </select>
          </div>
          {defaultMode === "EXAM" && (
            <div>
              <label className="type-data text-xs text-pencil">Duration (min)</label>
              <input type="number" min={1} max={600} value={examDurationMin} onChange={(e) => setExamDurationMin(Number(e.target.value))} className={`mt-1 block w-24 ${inputCls}`} />
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <EditableQuestionCard
            key={q._k}
            q={q}
            index={i}
            total={questions.length}
            onChange={(next) => updateQ(q._k, next)}
            onMove={(dir) => moveQ(q._k, dir)}
            onDelete={() => deleteQ(q._k)}
          />
        ))}
        <Button
          variant="outline"
          disabled={questions.length >= MAX_BANK_QUESTIONS}
          onClick={() => setQuestions((qs) => [...qs, blankQ()])}
          className="w-full"
        >
          + Add question
        </Button>
        {questions.length >= MAX_BANK_QUESTIONS && (
          <p className="type-data text-center text-[11px] text-pencil">Maximum {MAX_BANK_QUESTIONS} questions per bank.</p>
        )}
      </div>

      {error && <p className="text-sm text-redpen">{error}</p>}

      {/* Sticky save bar */}
      <div className="paper-sheet sticky bottom-4 flex items-center justify-between p-3">
        <span className="type-data text-xs text-pencil">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/my-banks/${bankId}`}>Cancel</Link>
          </Button>
          <Button onClick={save} disabled={saving} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
