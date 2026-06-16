"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";
import {
  normalizeQuestion,
  gradeAnswer,
  displayCorrectAnswer,
  displayUserAnswer,
  type QuestionType,
} from "@/lib/exam-helpers";
import AnswerInput from "./AnswerInput";
import type { Bank, BankExamResult } from "./types";

type Phase = "intro" | "running" | "results";

function fmt(sec: number) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function BankExam({ bank }: { bank: Bank }) {
  const normalized = useMemo<QuestionType[]>(
    () => bank.questions.map((q) => normalizeQuestion(q)),
    [bank.questions]
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const durationSec = (bank.examDurationMin && bank.examDurationMin > 0 ? bank.examDurationMin : 60) * 60;
  const [remaining, setRemaining] = useState(durationSec);
  const [result, setResult] = useState<BankExamResult | null>(null);
  const submittedRef = useRef(false);

  const compute = useCallback((): BankExamResult => {
    let correct = 0;
    let graded = 0;
    let incorrect = 0;
    const byTopic: Record<string, { correct: number; total: number }> = {};

    normalized.forEach((q, i) => {
      const verdict = gradeAnswer(q, answers[i] ?? null);
      if (verdict === null) return; // not auto-gradable
      graded++;
      const topic = bank.questions[i].topic || "Untagged";
      byTopic[topic] ??= { correct: 0, total: 0 };
      byTopic[topic].total++;
      if (verdict) {
        correct++;
        byTopic[topic].correct++;
      } else {
        incorrect++;
      }
    });

    return {
      takenAt: new Date().toISOString(),
      total: normalized.length,
      graded,
      correct,
      incorrect,
      ungraded: normalized.length - graded,
      score: graded ? Math.round((correct / graded) * 100) : 0,
      byTopic,
    };
  }, [answers, normalized, bank.questions]);

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const r = compute();
    setResult(r);
    setPhase("results");
    fetch(`/api/user-banks/${bank.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: r }),
    }).catch(() => {});
  }, [compute, bank.id]);

  // Countdown while running.
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (phase === "running" && remaining <= 0) submit();
  }, [phase, remaining, submit]);

  /* ------------------------------- intro ------------------------------- */
  if (phase === "intro") {
    return (
      <div className="paper-sheet space-y-4 p-6 text-center">
        <h2 className="type-display text-lg text-ink">Ready to start?</h2>
        <p className="text-sm text-pencil">
          {normalized.length} question{normalized.length === 1 ? "" : "s"} · {Math.round(durationSec / 60)} minutes.
          The timer starts when you begin and submits automatically when it runs out.
        </p>
        <Button
          onClick={() => {
            submittedRef.current = false;
            setRemaining(durationSec);
            setAnswers({});
            setPhase("running");
          }}
          className="bg-ballpoint text-paper hover:bg-ballpoint/90"
        >
          Start exam
        </Button>
      </div>
    );
  }

  /* ------------------------------ results ------------------------------ */
  if (phase === "results" && result) {
    return (
      <div className="space-y-4">
        <div className="paper-sheet space-y-3 p-6 text-center">
          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">Your score</p>
          <p className="type-display text-4xl text-ink">{result.score}%</p>
          <p className="text-sm text-pencil">
            {result.correct} correct · {result.incorrect} incorrect · {result.ungraded} not auto-graded · {result.total}{" "}
            total
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null);
              setPhase("intro");
            }}
          >
            Retake
          </Button>
        </div>

        {Object.keys(result.byTopic).length > 0 && (
          <div className="paper-sheet p-4">
            <p className="type-data mb-2 text-[11px] uppercase tracking-wide text-pencil">By topic</p>
            <ul className="space-y-1 text-sm">
              {Object.entries(result.byTopic).map(([topic, t]) => (
                <li key={topic} className="flex justify-between text-ink">
                  <span>{topic}</span>
                  <span className="text-pencil">
                    {t.correct}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Per-question review */}
        <div className="space-y-3">
          {normalized.map((q, i) => {
            const verdict = gradeAnswer(q, answers[i] ?? null);
            return (
              <div key={bank.questions[i].id} className="paper-sheet p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="type-data text-xs text-pencil">Q{i + 1}</span>
                  {verdict !== null && (
                    <span
                      className={`type-data rounded px-2 py-0.5 text-xs ${
                        verdict ? "bg-st-answered/15 text-st-answered" : "bg-redpen/10 text-redpen"
                      }`}
                    >
                      {verdict ? "Correct" : "Incorrect"}
                    </span>
                  )}
                </div>
                <div className="mb-2 text-sm text-ink">
                  <MathRenderer text={bank.questions[i].text} />
                </div>
                <p className="text-sm text-pencil">
                  <span className="type-data text-xs">Your answer: </span>
                  {displayUserAnswer(q, answers[i] ?? null)}
                </p>
                {q.type !== "Subjective" && (
                  <p className="text-sm text-st-answered">
                    <span className="type-data text-xs text-pencil">Correct answer: </span>
                    {displayCorrectAnswer(q)}
                  </p>
                )}
                {bank.questions[i].explanation && (
                  <div className="mt-2 text-sm text-pencil">
                    <p className="type-data mb-0.5 text-[11px] uppercase tracking-wide">Explanation</p>
                    <MathRenderer text={bank.questions[i].explanation!} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ------------------------------ running ------------------------------ */
  return (
    <div className="space-y-3">
      <div className="paper-sheet sticky top-20 z-10 flex items-center justify-between p-3">
        <span
          className={`type-data text-lg tabular-nums ${remaining <= 60 ? "text-redpen" : "text-ink"}`}
          aria-label="Time remaining"
        >
          {fmt(remaining)}
        </span>
        <Button size="sm" onClick={submit} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
          Submit exam
        </Button>
      </div>

      {bank.questions.map((q, i) => (
        <div key={q.id} className="paper-sheet p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="type-data text-xs text-pencil">Q{i + 1}</span>
            <span className="type-data rounded border border-st-review/30 bg-st-review/10 px-1.5 py-0.5 text-[11px] text-st-review">
              {q.type}
            </span>
          </div>
          <div className="mb-3 text-sm text-ink">
            <MathRenderer text={q.text} />
          </div>
          <AnswerInput
            type={q.type}
            options={q.options}
            value={answers[i] ?? ""}
            onChange={(v) => setAnswers((a) => ({ ...a, [i]: v }))}
          />
        </div>
      ))}

      <div className="flex justify-end pb-6">
        <Button onClick={submit} className="bg-ballpoint text-paper hover:bg-ballpoint/90">
          Submit exam
        </Button>
      </div>
    </div>
  );
}
