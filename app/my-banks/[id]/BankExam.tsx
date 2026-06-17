"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizeQuestion, type QuestionType, type ExamResultsType } from "@/lib/exam-helpers";
import ExamRunner from "@/app/mock-exam/ExamRunner";
import type { Bank, BankExamResult } from "./types";

function toBankResult(r: ExamResultsType): BankExamResult {
  return {
    takenAt: new Date().toISOString(),
    total: r.totalQuestions,
    graded: r.gradedQuestions,
    correct: r.correctAnswersCount,
    incorrect: r.incorrectAnswers,
    ungraded: r.ungradedQuestions,
    score: Math.round(r.score),
    byTopic: r.topicPerformance,
  };
}

export default function BankExam({ bank, userName }: { bank: Bank; userName: string }) {
  const totalAvailable = bank.questions.length;
  const [durationMin, setDurationMin] = useState(
    bank.examDurationMin && bank.examDurationMin > 0 ? bank.examDurationMin : 60
  );
  const [shuffle, setShuffle] = useState(false);
  const [count, setCount] = useState(totalAvailable);
  const [attempt, setAttempt] = useState(0);
  const [questions, setQuestions] = useState<QuestionType[] | null>(null);

  function start() {
    let qs: QuestionType[] = bank.questions.map(normalizeQuestion);
    if (shuffle) {
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }
    }
    const n = Math.max(1, Math.min(count || totalAvailable, qs.length));
    if (n < qs.length) qs = qs.slice(0, n);
    setQuestions(qs);
    setAttempt((a) => a + 1);
  }

  function backToSetup() {
    setQuestions(null);
  }

  // In-exam "Exit" mid-attempt — confirm first (matches the global Mock Exam).
  function exitDuringExam() {
    if (window.confirm("Exit the exam? This attempt won't be saved.")) setQuestions(null);
  }

  async function saveResult(r: ExamResultsType) {
    try {
      await fetch(`/api/user-banks/${bank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: toBankResult(r) }),
      });
    } catch {
      /* best-effort */
    }
  }

  if (questions) {
    return (
      <ExamRunner
        key={attempt}
        questions={questions}
        examTimeMinutes={durationMin}
        userName={userName}
        subject={bank.title}
        paperTitle={bank.title}
        onExit={exitDuringExam}
        onStartNewExam={backToSetup}
        onSaveResult={saveResult}
      />
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-xl">
      <div className="paper-sheet space-y-5 p-6">
        <div className="space-y-1">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Mock exam</p>
          <h1 className="type-display text-2xl text-ink">{bank.title}</h1>
          <p className="text-sm text-pencil">
            {totalAvailable} question{totalAvailable === 1 ? "" : "s"} available. Set it up and start when ready —
            the timer submits automatically when it runs out.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="type-data text-xs text-pencil">
              Duration (min)
              <input
                type="number"
                min={1}
                max={600}
                value={durationMin}
                onChange={(e) => setDurationMin(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
                className="mt-1 block w-24 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
              />
            </label>
            <label className="type-data text-xs text-pencil">
              Questions
              <input
                type="number"
                min={1}
                max={totalAvailable}
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(totalAvailable, Number(e.target.value) || 1)))
                }
                className="mt-1 block w-24 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            Shuffle question order
          </label>
        </div>

        <Button onClick={start} className="w-full bg-ballpoint text-paper hover:bg-ballpoint/90">
          Start exam
        </Button>
      </div>
    </div>
  );
}
