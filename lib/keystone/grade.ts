/**
 * Keystone — pure auto-grading normalizers for Learn's auto-graded checks.
 *
 * Grading ASSISTS, it never punishes: the player always offers a manual
 * "mark correct" override, so a too-strict match can't trap the student. To keep
 * that override one-directional and safe, the grader is biased AGAINST false
 * positives — a number buried in prose ("3 is wrong, it's 8") must NOT auto-pass.
 * All functions are pure and never throw.
 */

/** Pull the first number-like token out of a messy answer ("6 N", "x = 4",
 *  "$3.0$", "≈ 1,200", "−4") → a float, or NaN if there isn't one. */
export function normNum(raw: string): number {
  if (!raw) return NaN;
  const t = raw.replace(/−/g, "-").replace(/\$/g, "").replace(/,/g, "");
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

/** True when a string is ESSENTIALLY just a number — optionally a single
 *  "x =" variable prefix and/or a short trailing unit ("4", "x = 4", "$4$",
 *  "1,200", "−3", "6 N", "9.8 m/s") — and NOT a number buried in prose
 *  ("4x is wrong", "12 oranges"). Guards numeric auto-grading from false positives. */
function looksLikeNumber(s: string): boolean {
  const t = s
    .trim()
    .replace(/−/g, "-")
    .replace(/^[a-zA-Z]\s*=\s*/, "") // strip a single-variable assignment prefix
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();
  // a number, then at most a short (<=3 char) unit token, then end
  return /^[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?\s?[a-zA-Z%°/]{0,3}$/.test(t);
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

/** Order-insensitive token-set match after normalization, with an exact
 *  case-insensitive short-circuit first so one-word answers that ARE stop-words
 *  or symbols ("it", "%") still match. */
export function textMatches(answer: string, attempt: string): boolean {
  const exA = answer.trim().toLowerCase();
  const exB = attempt.trim().toLowerCase();
  if (exA && exA === exB) return true;
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

/** Default verdict for an integer/fillblank/short check. Numeric matching only
 *  fires when the relevant side(s) are LONE numbers — so a number embedded in a
 *  wrong free-text answer can't auto-pass (the override only ever marks correct,
 *  never wrong, so a false positive would be unrecoverable). */
export function gradeAnswer(format: string, answer: string, attempt: string): boolean {
  if (!attempt.trim() || !answer.trim()) return false;
  if (format === "integer") return looksLikeNumber(attempt) && numMatches(answer, attempt);
  // fillblank / short: prefer a text match; fall back to numeric only when BOTH
  // sides are clean lone numbers (e.g. answer "0", attempt "0").
  if (textMatches(answer, attempt)) return true;
  return looksLikeNumber(answer) && looksLikeNumber(attempt) && numMatches(answer, attempt);
}
