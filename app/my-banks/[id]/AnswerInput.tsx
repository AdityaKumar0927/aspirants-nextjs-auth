"use client";

import MathRenderer from "@/components/layout/MathRenderer";
import { parseMultiAnswer, encodeMultiAnswer, type ExamQuestionType } from "@/lib/exam-helpers";

const letter = (i: number) => String.fromCharCode(65 + i);

/**
 * Shared answer entry for one question, used by both bank (practice) and exam
 * modes. `value` is the encoded answer string the grader understands:
 *  - Multiple Choice  → a letter ("A")
 *  - Multiple Correct → comma-encoded letters ("A,C")
 *  - Integer/Numerical/Fill Blanks → the raw input
 *  - Subjective → the written text
 */
export default function AnswerInput({
  type,
  options,
  value,
  onChange,
  disabled = false,
}: {
  type: ExamQuestionType;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (type === "Multiple Choice") {
    return (
      <div className="space-y-2">
        {options.map((o, i) => {
          const key = letter(i);
          const selected = value === key;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              className={`flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors disabled:cursor-default ${
                selected ? "border-ballpoint bg-ballpoint/10 text-ink" : "border-rule bg-paper text-pencil hover:border-ballpoint/40"
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border type-data text-sm ${
                  selected ? "border-ballpoint bg-ballpoint text-paper" : "border-rule bg-paper text-pencil"
                }`}
              >
                {key}
              </span>
              <MathRenderer text={o} />
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "Multiple Correct") {
    const picked = new Set(parseMultiAnswer(value));
    return (
      <div className="space-y-2">
        {options.map((o, i) => {
          const key = letter(i);
          const selected = picked.has(key);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = new Set(picked);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                onChange(encodeMultiAnswer(Array.from(next)));
              }}
              className={`flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors disabled:cursor-default ${
                selected ? "border-ballpoint bg-ballpoint/10 text-ink" : "border-rule bg-paper text-pencil hover:border-ballpoint/40"
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border type-data text-sm ${
                  selected ? "border-ballpoint bg-ballpoint text-paper" : "border-rule bg-paper text-pencil"
                }`}
              >
                {selected ? "✓" : key}
              </span>
              <MathRenderer text={o} />
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "Subjective") {
    return (
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Write your answer…"
        className="w-full resize-none rounded-md border border-rule bg-paper p-3 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40 disabled:opacity-70"
      />
    );
  }

  // Integer / Numerical / Fill Blanks
  const numeric = type === "Integer" || type === "Numerical";
  return (
    <input
      type={numeric ? "number" : "text"}
      inputMode={numeric ? "decimal" : "text"}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={numeric ? "Enter a number…" : "Type your answer…"}
      className="w-full max-w-xs rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40 disabled:opacity-70"
    />
  );
}
