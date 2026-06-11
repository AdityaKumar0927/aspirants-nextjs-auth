/**
 * Deterministic post-extraction checks for the import review step.
 *
 * These run in app code (not the model): the answer key is parsed and joined to
 * questions by number with explicit conflict flags, and LaTeX is validated by
 * actually parsing it — so the model is never the sole arbiter of correctness.
 */
import katex from "katex";

const LETTER_RE = /[A-J]/g;
const NUMBER_RE = /-?\d+(?:\.\d+)?/;

/**
 * Parses a pasted answer key into questionNumber -> raw answer.
 * Tolerates "1: C", "1. C", "1) A,D", "Q1 - 4", "1   4.5", etc.
 */
export function parseAnswerKey(text: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!text) return map;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^(?:q|que|question)?\s*(\d+)\s*[).:\-–\s]\s*(.+)$/i);
    if (!m) continue;
    const num = m[1];
    const answer = m[2].trim();
    if (num && answer) map.set(num, answer);
  }
  return map;
}

function lettersIn(s: string): string[] {
  return Array.from(new Set((s.toUpperCase().match(LETTER_RE) ?? [])));
}

function numberIn(s: string): string | null {
  const m = s.match(NUMBER_RE);
  return m ? m[0] : null;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

export interface ReconcileInput {
  type: string;
  correctOption: string; // letter or ""
  correctOptions: string[]; // letters
  answerText: string;
}

export interface ReconcileResult {
  patch: Partial<{
    correctOption: string;
    correctOptions: string[];
    answerText: string;
  }>;
  note: string; // human-readable, shown in review
  conflict: boolean; // true => do NOT auto-apply; reviewer must resolve
}

/**
 * Joins one question to its answer-key entry (already looked up by number).
 * Fills a missing answer from the key; flags (without overwriting) a conflict
 * when the paper's answer disagrees with the key.
 */
export function reconcileAnswer(
  q: ReconcileInput,
  keyAnswer: string | undefined
): ReconcileResult {
  if (!keyAnswer) return { patch: {}, note: "", conflict: false };

  const isChoice =
    q.type === "Multiple Choice" || q.type === "Multiple Correct";

  if (isChoice) {
    const keyLetters = lettersIn(keyAnswer);
    if (keyLetters.length === 0) {
      return { patch: {}, note: `Answer key "${keyAnswer}" not understood`, conflict: false };
    }
    const current =
      q.type === "Multiple Choice"
        ? q.correctOption
          ? [q.correctOption]
          : []
        : q.correctOptions;

    if (current.length === 0) {
      const patch =
        q.type === "Multiple Choice"
          ? { correctOption: keyLetters[0] }
          : { correctOptions: keyLetters };
      return { patch, note: `Filled from answer key: ${keyLetters.join(", ")}`, conflict: false };
    }
    if (sameSet(current, keyLetters)) {
      return { patch: {}, note: "Confirmed by answer key", conflict: false };
    }
    return {
      patch: {},
      note: `Conflict — paper: ${current.join(", ")}, key: ${keyLetters.join(", ")}`,
      conflict: true,
    };
  }

  if (q.type === "Integer" || q.type === "Numerical") {
    const keyNum = numberIn(keyAnswer);
    if (keyNum === null) {
      return { patch: {}, note: `Answer key "${keyAnswer}" not understood`, conflict: false };
    }
    const current = q.answerText.trim();
    if (current === "") {
      return { patch: { answerText: keyNum }, note: `Filled from answer key: ${keyNum}`, conflict: false };
    }
    if (numberIn(current) === keyNum || Number(current) === Number(keyNum)) {
      return { patch: {}, note: "Confirmed by answer key", conflict: false };
    }
    return {
      patch: {},
      note: `Conflict — paper: ${current}, key: ${keyNum}`,
      conflict: true,
    };
  }

  return { patch: {}, note: "", conflict: false };
}

/**
 * Returns the LaTeX snippets in `text` that fail to parse, so the reviewer is
 * warned about broken math before it reaches the bank.
 */
export function findMathErrors(text: string): string[] {
  if (!text) return [];
  const errors: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const expr = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (!expr) continue;
    try {
      katex.renderToString(expr, { throwOnError: true, strict: false });
    } catch {
      errors.push(expr.trim().slice(0, 40));
    }
  }
  return errors;
}
