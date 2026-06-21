import type { ExamQuestionType } from "@/lib/exam-helpers";
import type { StructuredMarkscheme } from "@/lib/userbank/schema";

/** A question row as returned by GET /api/user-banks/[id]. */
export interface BankQuestion {
  id: string;
  order: number;
  text: string;
  type: ExamQuestionType;
  options: string[];
  correctOption: string | null;
  correctOptions: string[];
  answerText: string | null;
  answerMin: number | null;
  answerMax: number | null;
  explanation: string | null;
  markscheme: string | null;
  hints: string[];
  markschemeData: StructuredMarkscheme | null;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  marks: number | null;
  negMarks: number | null;
  completed: boolean;
  flagged: boolean;
}

export interface Bank {
  id: string;
  title: string;
  description: string | null;
  defaultMode: string;
  examDurationMin: number | null;
  questionCount: number;
  lastResult: BankExamResult | null;
  lastTakenAt: string | null;
  questions: BankQuestion[];
}

/** Summary persisted to UserBank.lastResult after an exam attempt. */
export interface BankExamResult {
  takenAt: string;
  total: number;
  graded: number;
  correct: number;
  incorrect: number;
  ungraded: number;
  score: number; // percentage over graded questions
  byTopic: Record<string, { correct: number; total: number }>;
}
