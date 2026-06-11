import type { Question } from "@prisma/client";

/**
 * Authoritatively grades a user's answer against the stored question, so
 * correctness is never trusted from the client.
 *
 * `selectedOption` may arrive as an option letter ("A"), the full option text,
 * or a numeric string (Integer/Numerical questions). Returns null when the
 * question has no recorded answer (e.g. an un-keyed draft) and correctness
 * cannot be determined.
 */
export function gradeAnswer(
  question: Pick<
    Question,
    | "type"
    | "options"
    | "correctOption"
    | "correctOptions"
    | "answerText"
    | "answerMin"
    | "answerMax"
  >,
  selectedOption: string
): boolean | null {
  const selected = (selectedOption ?? "").trim();
  if (!selected) return false;

  const type = question.type ?? "Multiple Choice";

  // Numeric answers: compare as numbers (range first, then exact).
  if (type === "Numerical" || type === "Integer") {
    const value = Number(selected);
    if (Number.isNaN(value)) return false;
    if (question.answerMin != null || question.answerMax != null) {
      const min = question.answerMin ?? -Infinity;
      const max = question.answerMax ?? Infinity;
      return value >= min && value <= max;
    }
    if (question.answerText != null && question.answerText.trim() !== "") {
      return Number(question.answerText.trim()) === value;
    }
    return null;
  }

  // Choice answers: normalize the selection to an option letter.
  const selectedLetter = toLetter(selected, question.options);
  if (!selectedLetter) return false;

  const correctLetters = new Set<string>();
  if (question.correctOption) {
    const l = toLetter(question.correctOption, question.options);
    if (l) correctLetters.add(l);
  }
  for (const c of question.correctOptions ?? []) {
    const l = toLetter(c, question.options);
    if (l) correctLetters.add(l);
  }
  if (correctLetters.size === 0) return null;

  return correctLetters.has(selectedLetter);
}

/** Resolves a value (letter or option text) to its option letter, or null. */
function toLetter(value: string, options: string[]): string | null {
  const trimmed = value.trim();
  if (/^[A-J]$/i.test(trimmed)) return trimmed.toUpperCase();
  const index = (options ?? []).findIndex((o) => o.trim() === trimmed);
  return index >= 0 ? String.fromCharCode(65 + index) : null;
}
