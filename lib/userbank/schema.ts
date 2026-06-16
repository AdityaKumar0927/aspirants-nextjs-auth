import { z } from "zod";
import { canonicalType, type ExamQuestionType } from "@/lib/exam-helpers";

/**
 * "Bring your own material" — the JSON contract a student's AI tool must produce,
 * plus a LENIENT validator that normalizes messy output and returns per-question
 * WARNINGS (rather than hard-failing) so the create flow can show a review step.
 *
 * The same module runs client-side (the review step) and server-side (the
 * authoritative re-check in /api/user-banks) — keep it free of server-only deps.
 */

export const MAX_BANK_QUESTIONS = 500;
export const MAX_OPTIONS = 10;
const MAX_TEXT = 20_000;
const MAX_RICH = 50_000;
const MAX_FIELD = 5_000;

export type UserBankQuestionType = ExamQuestionType;

/** A normalized question, ready to render or persist as a UserBankQuestion. */
export interface NormalizedBankQuestion {
  text: string;
  type: UserBankQuestionType;
  options: string[];
  correctOption: string | null;
  correctOptions: string[];
  answerText: string | null;
  answerMin: number | null;
  answerMax: number | null;
  explanation: string | null;
  markscheme: string | null;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  marks: number | null;
  negMarks: number | null;
}

export interface BankWarning {
  /** Index into the returned `questions` array. */
  index: number;
  message: string;
}

export interface ValidatedBank {
  title: string;
  description: string | null;
  questions: NormalizedBankQuestion[];
  /** Non-fatal per-question issues (e.g. "no correct option marked"). */
  warnings: BankWarning[];
  /** Items dropped as unusable (no question text). */
  droppedCount: number;
  /** True if the input exceeded MAX_BANK_QUESTIONS and was truncated. */
  truncated: boolean;
}

/** Create-form meta, validated separately from the questions array. */
export const bankMetaSchema = z.object({
  title: z.string().trim().min(1, "Give your bank a title").max(200),
  description: z.string().trim().max(2_000).nullish(),
  defaultMode: z.enum(["BANK", "EXAM"]).default("BANK"),
  examDurationMin: z.coerce.number().int().min(1).max(600).nullish(),
});
export type BankMeta = z.infer<typeof bankMetaSchema>;

/* ----------------------------- normalization ----------------------------- */

const trimStr = (v: unknown, max = MAX_FIELD): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const letterFor = (i: number) => String.fromCharCode(65 + i);

/** Map a correct-answer reference (letter or full option text) to a letter key.
 *  Unmatched values pass through unchanged so the warning step can flag them. */
function toKey(value: string, options: string[]): string {
  const t = value.trim();
  if (/^[A-J]$/i.test(t)) return t.toUpperCase();
  const idx = options.findIndex((o) => o.trim() === t);
  return idx >= 0 ? letterFor(idx) : t;
}

function normalizeOne(raw: any): NormalizedBankQuestion | null {
  const text = trimStr(raw?.text, MAX_TEXT);
  if (!text) return null; // no question text → unusable

  const options = (Array.isArray(raw?.options) ? raw.options : [])
    .map((o: unknown) => trimStr(o))
    .filter((o: string | null): o is string => !!o)
    .slice(0, MAX_OPTIONS);

  const type = canonicalType(raw?.type, options.length > 0);

  const rawCorrect = trimStr(raw?.correctOption);
  const correctOption = rawCorrect ? toKey(rawCorrect, options) : null;
  const correctOptions = (Array.isArray(raw?.correctOptions) ? raw.correctOptions : [])
    .map((c: unknown) => trimStr(c))
    .filter((c: string | null): c is string => !!c)
    .map((c: string) => toKey(c, options));

  return {
    text,
    type,
    options,
    correctOption,
    correctOptions,
    answerText: trimStr(raw?.answerText, MAX_TEXT),
    answerMin: toNum(raw?.answerMin),
    answerMax: toNum(raw?.answerMax),
    explanation: trimStr(raw?.explanation, MAX_RICH),
    markscheme: trimStr(raw?.markscheme, MAX_RICH),
    subject: trimStr(raw?.subject, 200),
    topic: trimStr(raw?.topic, 200),
    difficulty: trimStr(raw?.difficulty, 50),
    marks: toNum(raw?.marks),
    negMarks: toNum(raw?.negMarks),
  };
}

const optionExists = (key: string, options: string[]) =>
  /^[A-J]$/.test(key) && key.charCodeAt(0) - 65 < options.length;

/** Per-type sanity check mirroring lib/validations/question.ts (validateAnswerShape),
 *  but returns a human-readable warning instead of throwing. null = looks fine. */
export function answerWarning(q: NormalizedBankQuestion): string | null {
  switch (q.type) {
    case "Multiple Choice":
      if (q.options.length < 2) return "Has fewer than 2 options.";
      if (!q.correctOption) return "No correct option marked — you won't be able to grade this.";
      if (!optionExists(q.correctOption, q.options))
        return `Correct option "${q.correctOption.slice(0, 24)}" doesn't match any option.`;
      return null;
    case "Multiple Correct":
      if (q.options.length < 2) return "Has fewer than 2 options.";
      if (q.correctOptions.length < 1)
        return "No correct options marked — you won't be able to grade this.";
      for (const k of q.correctOptions)
        if (!optionExists(k, q.options))
          return `Correct option "${k.slice(0, 24)}" doesn't match any option.`;
      return null;
    case "Integer":
      if (!q.answerText) return "No answer provided.";
      if (!/^-?\d+$/.test(q.answerText)) return "Answer isn't a whole number.";
      return null;
    case "Numerical":
      if (!q.answerText && q.answerMin == null && q.answerMax == null)
        return "No answer or range provided.";
      if (q.answerMin != null && q.answerMax != null && q.answerMin > q.answerMax)
        return "Minimum is greater than maximum.";
      return null;
    case "Fill Blanks":
      if (!q.answerText) return "No answer provided.";
      return null;
    case "Subjective":
      return null;
  }
}

/**
 * Normalize a parsed import (either `{ title?, description?, questions: [...] }`
 * or a bare `[...]`) into usable questions + warnings. Never throws.
 */
export function validateBankImport(raw: unknown): ValidatedBank {
  const isArr = Array.isArray(raw);
  const obj: any = raw && typeof raw === "object" ? raw : {};
  const rawList: unknown[] = isArr ? (raw as unknown[]) : Array.isArray(obj.questions) ? obj.questions : [];

  const title = (isArr ? null : trimStr(obj.title, 200)) || "Untitled bank";
  const description = isArr ? null : trimStr(obj.description, 2_000);

  const questions: NormalizedBankQuestion[] = [];
  const warnings: BankWarning[] = [];
  let droppedCount = 0;

  for (const item of rawList.slice(0, MAX_BANK_QUESTIONS)) {
    const q = normalizeOne(item);
    if (!q) {
      droppedCount++;
      continue;
    }
    const index = questions.length;
    questions.push(q);
    const w = answerWarning(q);
    if (w) warnings.push({ index, message: w });
  }

  return {
    title,
    description,
    questions,
    warnings,
    droppedCount,
    truncated: rawList.length > MAX_BANK_QUESTIONS,
  };
}

/** A normalized question that carries its existing id (for edit/diff-save). */
export interface EditBankQuestion extends NormalizedBankQuestion {
  id?: string;
}

/**
 * Normalize a list of questions for an EDIT save, preserving each item's `id`
 * when present so the API can diff against the stored rows (update vs insert vs
 * delete). Items with no text are dropped, mirroring validateBankImport.
 */
export function normalizeEditQuestions(raw: unknown): EditBankQuestion[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: EditBankQuestion[] = [];
  for (const item of list.slice(0, MAX_BANK_QUESTIONS)) {
    const q = normalizeOne(item);
    if (!q) continue;
    const id = item && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : undefined;
    out.push(id ? { id, ...q } : q);
  }
  return out;
}

/**
 * Extract a JSON value from pasted text — tolerates ```json fences and leading
 * prose by grabbing the first balanced {...} / [...] block.
 */
export function parseImportText(
  text: string
): { ok: true; data: unknown } | { ok: false; error: string } {
  let s = (text ?? "").trim();
  if (!s) return { ok: false, error: "Nothing to import — paste the JSON your AI tool produced." };

  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  if (!/^[[{]/.test(s)) {
    const m = s.match(/[[{][\s\S]*[\]}]/);
    if (m) s = m[0];
  }

  try {
    return { ok: true, data: JSON.parse(s) };
  } catch {
    return {
      ok: false,
      error: "That isn't valid JSON. Make sure you copied the entire JSON block (and nothing extra).",
    };
  }
}
