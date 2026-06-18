/**
 * Keystone — pure auto-grading normalizers for Learn's auto-graded checks.
 *
 * Grading ASSISTS, it never punishes: the player always offers a manual
 * "mark correct" override, so a too-strict match can't trap the student. These
 * helpers only decide the *default* verdict. All functions are pure and never throw.
 */

/** Pull the first number-like token out of a messy answer ("6 N", "x = 4",
 *  "$3.0$", "≈ 1,200") → a float, or NaN if there isn't one. */
export function normNum(raw: string): number {
  if (!raw) return NaN;
  const t = raw.replace(/\$/g, "").replace(/,/g, "");
  const m = t.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

/** Numeric match with a small relative tolerance (exact for integers). */
export function numMatches(answer: string, attempt: string): boolean {
  const a = normNum(answer);
  const b = normNum(attempt);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= 1e-9 + 1e-3 * Math.abs(a);
}

/** Lowercase, strip $…$ delimiters (keep the inner text), drop punctuation and a
 *  few stop-words, collapse whitespace — so "the Velocity." ≈ "velocity". */
export function normText(raw: string): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(the|a|an|is|are|of|to|it|its)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Order-insensitive token-set match after normalization. */
export function textMatches(answer: string, attempt: string): boolean {
  const a = normText(answer);
  const b = normText(attempt);
  if (!a || !b) return false;
  if (a === b) return true;
  const sa = new Set(a.split(" "));
  const sb = new Set(b.split(" "));
  if (sa.size !== sb.size) return false;
  for (const t of sa) if (!sb.has(t)) return false;
  return true;
}

/** Default verdict for an integer/fillblank/short check. Tries numeric first
 *  (covers answers like "0"), then falls back to a normalized text match. */
export function gradeAnswer(format: string, answer: string, attempt: string): boolean {
  if (!attempt.trim() || !answer.trim()) return false;
  if (format === "integer") return numMatches(answer, attempt);
  return numMatches(answer, attempt) || textMatches(answer, attempt);
}
