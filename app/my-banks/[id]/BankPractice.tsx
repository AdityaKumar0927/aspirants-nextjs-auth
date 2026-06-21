"use client";

import { useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import QuestionBankContent, {
  type QuestionSource,
  type QuestionPersistence,
  type QuestionBankFeatures,
  type QuestionType as QbQuestion,
} from "@/app/question-bank/QuestionBankContent";
import type { Bank, BankQuestion } from "./types";

const distinct = (vals: (string | null | undefined)[]) =>
  Array.from(new Set(vals.filter((v): v is string => !!v)));

/** Bank row → the Question Bank's runtime question shape. The card renders by
 *  type string and only knows "Mcqm" for multiple-correct, so translate that;
 *  grading stays correct because normalizeQuestion canonicalizes it back. */
function toQbQuestion(row: BankQuestion, index: number): QbQuestion {
  return {
    id: index,
    questionId: row.id,
    text: row.text,
    type: row.type === "Multiple Correct" ? "Mcqm" : row.type,
    options: row.options,
    correctOption: row.correctOption ?? undefined,
    correctOptions: row.correctOptions,
    answerText: row.answerText,
    answerMin: row.answerMin,
    answerMax: row.answerMax,
    explanation: row.explanation ?? undefined,
    markscheme: row.markscheme ?? undefined,
    hints: row.hints,
    markschemeData: row.markschemeData,
    subject: row.subject ?? undefined,
    topic: row.topic ?? undefined,
    difficulty: row.difficulty ?? undefined,
    completed: row.completed,
    reviewed: row.flagged,
    customTags: [],
  };
}

type Facets = { subjects: string[]; topics: string[]; difficulties: string[]; types: string[] };

function applyFacets(rows: BankQuestion[], f: Facets): BankQuestion[] {
  return rows.filter((r) => {
    if (f.subjects.length && !(r.subject && f.subjects.includes(r.subject))) return false;
    if (f.topics.length && !(r.topic && f.topics.includes(r.topic))) return false;
    if (f.difficulties.length && !(r.difficulty && f.difficulties.includes(r.difficulty))) return false;
    if (f.types.length && !(r.type && f.types.includes(r.type))) return false;
    return true;
  });
}

export default function BankPractice({ bank }: { bank: Bank }) {
  const rows = bank.questions;

  const source = useMemo<QuestionSource>(
    () => ({
      loadQuestions: (filters) => {
        const filtered = applyFacets(rows, filters);
        return { data: filtered.map(toQbQuestion), totalCount: filtered.length };
      },
      loadFilterOptions: () => ({
        exams: [],
        years: [],
        subtopics: [],
        customTags: [],
        subjects: distinct(rows.map((r) => r.subject)),
        topics: distinct(rows.map((r) => r.topic)),
        difficulties: distinct(rows.map((r) => r.difficulty)),
        types: distinct(rows.map((r) => r.type)),
      }),
      loadStats: (filters) => {
        const filtered = applyFacets(rows, filters);
        const completed = filtered.filter((r) => r.completed).length;
        const reviewed = filtered.filter((r) => r.flagged).length;
        return { total: filtered.length, completed, reviewed, notAnswered: filtered.length - completed };
      },
    }),
    [rows]
  );

  const persistence = useMemo<QuestionPersistence>(
    () => ({
      saveProgress: async ({ questionId, completed, reviewed }) => {
        const payload: Record<string, unknown> = { questionId };
        if (completed !== undefined) payload.completed = completed;
        if (reviewed !== undefined) payload.flagged = reviewed; // bank field is "flagged"
        const res = await fetch(`/api/user-banks/${bank.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.ok;
      },
      // recordAnswer intentionally omitted — private banks don't feed the Merit List.
    }),
    [bank.id]
  );

  const features = useMemo<Partial<QuestionBankFeatures>>(
    () => ({
      examYearFilters: false,
      customTags: false,
      community: false,
      difficultyRating: false,
      pagination: false,
      signInGate: false,
      meritRecording: false,
      learningMode: true,
    }),
    []
  );

  return (
    <SessionProvider>
      <QuestionBankContent
        source={source}
        persistence={persistence}
        features={features}
        title={bank.title}
        eyebrow="Your question bank"
      />
    </SessionProvider>
  );
}
