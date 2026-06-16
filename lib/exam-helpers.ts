/**
 * exam-helpers.ts
 *
 * Shared runtime model + grading for the practice and mock-exam flows.
 * Supports all five question types: Multiple Choice, Multiple Correct, Integer,
 * Numerical, and Subjective. Questions coming from /api/questions have
 * `options: string[]` and letter-based answers; `normalizeQuestion` converts
 * them into the letter-keyed shape the UI renders, and `gradeAnswer` scores an
 * attempt the same way the server grader (lib/grade.ts) does.
 */

export const EXAM_QUESTION_TYPES = [
  "Multiple Choice",
  "Multiple Correct",
  "Integer",
  "Numerical",
  "Fill Blanks",
  "Subjective",
] as const;

export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

export interface QuestionType {
  id: string;
  questionId?: string;

  text: string;

  /** Letter-keyed options, e.g. { A: "...", B: "..." } (MCQ types only). */
  options: { [key: string]: string };

  /** Single correct option letter (Multiple Choice). */
  correctOption: string;
  /** Correct option letters (Multiple Correct). */
  correctOptions: string[];
  /** Model/accepted answer for Integer / Numerical / Subjective. */
  answerText: string | null;
  /** Inclusive accepted range for Numerical. */
  answerMin: number | null;
  answerMax: number | null;

  exam: string;
  subject: string;
  year: string | number;
  topic: string;
  subtopic: string;

  diagramUrl?: string;
  type: ExamQuestionType;

  markscheme?: string;
  explanation?: string;

  difficulty: string;
}

const letterFor = (index: number) => String.fromCharCode(65 + index);

/** Maps a value (letter or option text) to its option letter, or "". */
function toLetter(value: string | null | undefined, optionTexts: string[]): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (/^[A-J]$/i.test(trimmed)) return trimmed.toUpperCase();
  const idx = optionTexts.findIndex((o) => o.trim() === trimmed);
  return idx >= 0 ? letterFor(idx) : "";
}

/** Normalizes a free-form type string into one of the five canonical types. */
export function canonicalType(raw: unknown, hasOptions: boolean): ExamQuestionType {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "multiple correct" || s === "mcqm" || s.includes("multiple correct") || s.includes("multi"))
    return "Multiple Correct";
  if (s === "multiple choice" || s === "mcq" || s.includes("choice")) return "Multiple Choice";
  if (s.includes("integer") || s === "int") return "Integer";
  if (s.includes("numeric") || s === "num") return "Numerical";
  if (s.includes("fill")) return "Fill Blanks"; // "fill-blanks", "fill blanks"
  if (s.includes("subjective") || s.includes("descriptive") || s.includes("essay"))
    return "Subjective";
  return hasOptions ? "Multiple Choice" : "Numerical";
}

/**
 * Converts a raw API question (options as string[], letter answers) into the
 * normalized runtime shape the exam/practice UI consumes.
 */
export function normalizeQuestion(raw: any): QuestionType {
  const rawOptions = Array.isArray(raw?.options)
    ? raw.options
    : raw?.options && typeof raw.options === "object"
    ? Object.values(raw.options as Record<string, unknown>)
    : [];
  // Defensive: a malformed DB row must degrade safely, not crash the renderer.
  const optionTexts: string[] = (rawOptions as unknown[]).filter(
    (o): o is string => typeof o === "string"
  );

  const options: { [key: string]: string } = {};
  optionTexts.forEach((text, i) => {
    options[letterFor(i)] = text;
  });

  const correctOption = toLetter(raw?.correctOption, optionTexts);
  const correctOptions: string[] = Array.isArray(raw?.correctOptions)
    ? raw.correctOptions
        .map((c: string) => toLetter(c, optionTexts))
        .filter((l: string) => l.length > 0)
    : [];

  const type = canonicalType(raw?.type, optionTexts.length > 0);

  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Integer/Numerical/Fill-Blanks answers live in `correctOption` (e.g. "58" or
  // "4.7 to 4.9"); the toLetter() call above nulls it for option-less questions.
  // Recover it as the model answer so the grader can score them.
  const answerInCorrectOption =
    type === "Integer" || type === "Numerical" || type === "Fill Blanks";
  const rawCorrect = raw?.correctOption != null ? String(raw.correctOption).trim() : "";
  const numericAnswerText =
    raw?.answerText != null && String(raw.answerText).trim() !== ""
      ? raw.answerText
      : answerInCorrectOption && rawCorrect !== ""
      ? rawCorrect
      : null;

  return {
    id: String(raw?.id ?? raw?.questionId ?? ""),
    questionId: raw?.questionId ? String(raw.questionId) : undefined,
    text: raw?.text ?? "",
    options,
    correctOption,
    correctOptions,
    answerText: numericAnswerText,
    answerMin: toNum(raw?.answerMin),
    answerMax: toNum(raw?.answerMax),
    exam: raw?.exam ?? "",
    subject: raw?.subject ?? "",
    year: raw?.year ?? "",
    topic: raw?.topic ?? "",
    subtopic: raw?.subtopic ?? "",
    diagramUrl: raw?.diagramUrl || undefined,
    type,
    markscheme: raw?.markscheme ?? undefined,
    explanation: raw?.explanation ?? "",
    difficulty: raw?.difficulty ?? "",
  };
}

/** The set of correct option letters for a choice question. */
function correctLetterSet(q: QuestionType): Set<string> {
  const set = new Set<string>();
  if (q.correctOption) set.add(q.correctOption);
  for (const l of q.correctOptions) set.add(l);
  return set;
}

/** Whether a question can be auto-graded (Subjective and key-less cannot). */
export function isAutoGradable(q: QuestionType): boolean {
  if (q.type === "Subjective") return false;
  if (q.type === "Multiple Choice" || q.type === "Multiple Correct") {
    return correctLetterSet(q).size > 0;
  }
  // Integer / Numerical / Fill Blanks (answer recorded as text/range/number)
  return (
    (q.answerText != null && q.answerText !== "") ||
    q.answerMin != null ||
    q.answerMax != null
  );
}

/** Normalize a free-text answer for lenient comparison (Fill Blanks). */
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/\$+/g, "")
    .replace(/\\[,;]/g, "")
    .replace(/\s+/g, "")
    .replace(/[.,;]+$/g, "");
}

/** Parses a Multiple-Correct answer encoding ("A,C") into letters. */
export function parseMultiAnswer(answer: string | null | undefined): string[] {
  if (!answer) return [];
  return Array.from(new Set((answer.toUpperCase().match(/[A-J]/g) ?? [])));
}

/** Encodes selected Multiple-Correct letters into the stored answer string. */
export function encodeMultiAnswer(letters: string[]): string {
  return Array.from(new Set(letters)).sort().join(",");
}

/**
 * Grades an attempt. Returns true/false, or null when the question can't be
 * auto-graded (Subjective, or no answer key recorded) so scoring can skip it.
 */
export function gradeAnswer(q: QuestionType, answer: string | null): boolean | null {
  if (!isAutoGradable(q)) return null;
  const selected = (answer ?? "").trim();
  if (selected === "") return false;

  switch (q.type) {
    case "Multiple Choice": {
      const correct = correctLetterSet(q);
      return correct.has(toLetter(selected, Object.values(q.options)));
    }
    case "Multiple Correct": {
      const correct = correctLetterSet(q);
      const picked = new Set(parseMultiAnswer(selected));
      if (picked.size !== correct.size) return false;
      for (const l of picked) if (!correct.has(l)) return false;
      return true;
    }
    case "Integer":
    case "Numerical": {
      const value = Number(selected);
      if (Number.isNaN(value)) return false;
      if (q.answerMin != null || q.answerMax != null) {
        const min = q.answerMin ?? -Infinity;
        const max = q.answerMax ?? Infinity;
        return value >= min && value <= max;
      }
      if (q.answerText != null && q.answerText.trim() !== "") {
        return Number(q.answerText.trim()) === value;
      }
      return false;
    }
    case "Fill Blanks": {
      const correct = (q.answerText ?? "").trim();
      if (!correct) return null;
      // Numeric range, e.g. "4.7 to 4.9".
      const range = correct.match(/^(-?\d+(?:\.\d+)?)\s*(?:to|–|-)\s*(-?\d+(?:\.\d+)?)$/i);
      const num = Number(selected.replace(/\s+/g, ""));
      if (range && !Number.isNaN(num)) {
        return num >= Number(range[1]) && num <= Number(range[2]);
      }
      // Comma-separated answers compared as an order-independent set; otherwise
      // a normalized exact match (case/space/LaTeX-`$`-insensitive).
      const correctParts = correct.split(",").map(normalizeText).filter(Boolean).sort();
      const answerParts = selected.split(",").map(normalizeText).filter(Boolean).sort();
      if (correctParts.length > 1) {
        return (
          correctParts.length === answerParts.length &&
          correctParts.every((c, i) => c === answerParts[i])
        );
      }
      return normalizeText(selected) === normalizeText(correct);
    }
    default:
      return null;
  }
}

/** Human-readable correct answer for results display. */
export function displayCorrectAnswer(q: QuestionType): string {
  switch (q.type) {
    case "Multiple Choice":
      return q.correctOption || "—";
    case "Multiple Correct": {
      const letters = Array.from(correctLetterSet(q)).sort();
      return letters.length ? letters.join(", ") : "—";
    }
    case "Integer":
    case "Numerical":
    case "Fill Blanks":
      if (q.answerText) return q.answerText;
      if (q.answerMin != null || q.answerMax != null)
        return `${q.answerMin ?? "−∞"} to ${q.answerMax ?? "∞"}`;
      return "—";
    case "Subjective":
      return q.answerText || "Model answer not provided";
    default:
      return "—";
  }
}

/** Human-readable user answer for results display. */
export function displayUserAnswer(q: QuestionType, answer: string | null): string {
  if (!answer) return "Not answered";
  if (q.type === "Multiple Correct") return parseMultiAnswer(answer).join(", ") || "—";
  return answer;
}

/**
 * For tracking performance in a topic or subtopic:
 */
export interface TopicPerformance {
  correct: number;
  total: number;
}

/**
 * Aggregated exam results after submission:
 */
export interface ExamResultsType {
  totalQuestions: number;
  gradedQuestions: number;
  correctAnswersCount: number;
  incorrectAnswers: number;
  ungradedQuestions: number;
  score: number;

  topicPerformance: Record<string, TopicPerformance>;
  subtopicPerformance: Record<string, TopicPerformance>;
  topStrengths: [string, TopicPerformance][];
  topWeaknesses: [string, TopicPerformance][];

  userAnswers: string[];
  correctAnswers: string[];

  timeSpentPerQuestion: number[];
  averageTimePerQuestion: number;

  topicWiseIncorrectAnswers: Record<string, number>;

  questions: QuestionType[];

  skillLevels: Record<string, number>;
}
