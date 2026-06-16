"use client";

import { useMemo, useState } from "react";
import { Flag, Check } from "@/components/desk/icons";
import MathRenderer from "@/components/layout/MathRenderer";
import { normalizeQuestion, gradeAnswer, displayCorrectAnswer } from "@/lib/exam-helpers";
import AnswerInput from "./AnswerInput";
import type { Bank, BankQuestion } from "./types";

function patchQuestion(bankId: string, questionId: string, body: Record<string, unknown>) {
  // Fire-and-forget; the UI updates optimistically.
  fetch(`/api/user-banks/${bankId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, ...body }),
  }).catch(() => {});
}

function BankQuestionCard({ bankId, q, num }: { bankId: string; q: BankQuestion; num: number }) {
  const normalized = useMemo(() => normalizeQuestion(q), [q]);
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(q.completed);
  const [flagged, setFlagged] = useState(q.flagged);

  const isSubjective = q.type === "Subjective";
  const verdict = revealed && !isSubjective ? gradeAnswer(normalized, value) : null;

  function toggleComplete() {
    const next = !completed;
    setCompleted(next);
    patchQuestion(bankId, q.id, { completed: next });
  }
  function toggleFlag() {
    const next = !flagged;
    setFlagged(next);
    patchQuestion(bankId, q.id, { flagged: next });
  }

  return (
    <div className={`paper-sheet p-4 ${flagged ? "border-l-[3px] border-l-st-review" : ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="type-data text-xs text-pencil">Q{num}</span>
          <span className="type-data rounded border border-st-review/30 bg-st-review/10 px-1.5 py-0.5 text-[11px] text-st-review">
            {q.type}
          </span>
          {q.topic && <span className="type-data text-[11px] text-pencil">{q.topic}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFlag}
            title={flagged ? "Unflag" : "Flag for review"}
            className={`rounded-md p-1.5 transition-colors ${flagged ? "text-st-review" : "text-pencil hover:text-ink"}`}
          >
            <Flag className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleComplete}
            title={completed ? "Mark not done" : "Mark complete"}
            className={`rounded-md p-1.5 transition-colors ${completed ? "text-st-answered" : "text-pencil hover:text-ink"}`}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-3 text-sm text-ink">
        <MathRenderer text={q.text} />
      </div>

      <AnswerInput
        type={q.type}
        options={q.options}
        value={value}
        onChange={setValue}
        disabled={revealed}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="rounded-md bg-ballpoint px-3 py-1.5 text-sm text-paper transition-colors hover:bg-ballpoint/90"
          >
            {isSubjective ? "Show model answer" : "Check answer"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              setValue("");
            }}
            className="type-data text-xs text-pencil hover:text-ink"
          >
            Try again
          </button>
        )}

        {revealed && !isSubjective && (
          <span
            className={`type-data rounded px-2 py-0.5 text-xs ${
              verdict === true
                ? "bg-st-answered/15 text-st-answered"
                : verdict === false
                  ? "bg-redpen/10 text-redpen"
                  : "bg-secondary text-pencil"
            }`}
          >
            {verdict === true ? "Correct" : verdict === false ? "Incorrect" : "Not auto-graded"}
          </span>
        )}
      </div>

      {revealed && (
        <div className="mt-3 space-y-2 border-t border-rule pt-3 text-sm">
          {!isSubjective && (
            <p className="text-ink">
              <span className="type-data text-xs text-pencil">Correct answer: </span>
              <span className="text-st-answered">{displayCorrectAnswer(normalized)}</span>
            </p>
          )}
          {q.explanation && (
            <div className="text-pencil">
              <p className="type-data mb-0.5 text-[11px] uppercase tracking-wide text-pencil">Explanation</p>
              <MathRenderer text={q.explanation} />
            </div>
          )}
          {q.markscheme && (
            <div className="text-pencil">
              <p className="type-data mb-0.5 text-[11px] uppercase tracking-wide text-pencil">Mark scheme</p>
              <MathRenderer text={q.markscheme} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BankPractice({ bank }: { bank: Bank }) {
  if (bank.questions.length === 0) {
    return <div className="paper-sheet p-8 text-center text-sm text-pencil">This bank has no questions.</div>;
  }
  return (
    <div className="space-y-3">
      {bank.questions.map((q, i) => (
        <BankQuestionCard key={q.id} bankId={bank.id} q={q} num={i + 1} />
      ))}
    </div>
  );
}
