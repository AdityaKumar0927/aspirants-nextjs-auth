/* ------------------------------------------------------------------
   exam-results.tsx — THE MARKSHEET, in the desk design system.
   Presentational only; grading/data shape comes from mock-exam.tsx.
-------------------------------------------------------------------*/
"use client"

import React, { useState, useMemo } from "react"
import { isImageSrc } from "@/lib/is-image-src"
import { motion } from "framer-motion"
import html2pdf from "html2pdf.js"
import "chart.js/auto"

import { ArrowLeft, ArrowRight, Download } from "lucide-react"
import { Pie, Bar } from "react-chartjs-2"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionTrigger,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"

import MathRenderer from "@/components/layout/MathRenderer"
import { OmrBubble, MarksChip, PaperEyebrow } from "@/components/desk"
import {
  displayCorrectAnswer,
  displayUserAnswer,
  gradeAnswer,
  parseMultiAnswer,
  type ExamResultsType,
  type QuestionType,
} from "@/lib/exam-helpers"

/** Correct option letters for a choice question. */
function correctLetters(q: QuestionType): Set<string> {
  return new Set([q.correctOption, ...q.correctOptions].filter(Boolean))
}

/** Helper: format seconds into mm:ss */
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Printed-paper meta line for a question: exam · year · subject · difficulty
 * · type, in the mono eyebrow voice.
 */
function renderQuestionMeta(q: QuestionType) {
  const parts = [q.exam, q.year, q.subject, q.difficulty, q.type].filter(Boolean)
  if (!parts.length) return null

  return (
    <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
      {parts.join(" · ")}
    </p>
  )
}

/** Renders a question diagram if present. */
function renderDiagram(diagramUrl?: string) {
  if (!diagramUrl) return null
  return (
    <div className="relative w-full max-w-xl mx-auto mb-4">
      <img
        src={diagramUrl}
        alt="Diagram"
        className="rounded-md w-full h-auto object-contain diagram-darkbg"
      />
    </div>
  )
}

/**
 * Read-only display of the question's options in OMR language:
 * the user's mark is graded green/red; the correct bubble is revealed
 * with a ring when the user missed it.
 */
function renderOptions(q: QuestionType, userAnswer: string | null) {
  if (!q.options) return null

  const correct = correctLetters(q)
  const userLetters =
    q.type === "Multiple Correct"
      ? parseMultiAnswer(userAnswer)
      : userAnswer
      ? [userAnswer]
      : []

  return (
    <div className="mt-4 flex flex-col space-y-1">
      {Object.entries(q.options).map(([optionKey, optionText]) => {
        const isCorrectOption = correct.has(optionKey)
        const isUserOption = userLetters.includes(optionKey)

        // The grader's pen: user's correct pick → green; user's wrong pick →
        // red with a strike; a missed correct option → reveal ring only.
        const verdict =
          isCorrectOption && isUserOption
            ? ("correct" as const)
            : isUserOption
            ? ("wrong" as const)
            : undefined
        const bubbleVerdict =
          verdict ?? (isCorrectOption ? ("reveal" as const) : undefined)

        return (
          <div
            key={optionKey}
            className="omr-option"
            data-state={isUserOption ? "selected" : undefined}
            data-verdict={verdict}
          >
            <OmrBubble filled={isUserOption} verdict={bubbleVerdict} className="mt-0.5">
              {optionKey}
            </OmrBubble>
            {isImageSrc(optionText) ? (
              <img
                src={optionText}
                alt={`Option ${optionKey}`}
                className="rounded-md w-full h-auto object-contain mt-2 diagram-darkbg"
              />
            ) : (
              <span
                className={`latex-font text-base leading-7 ${
                  verdict === "wrong" ? "ink-strike text-pencil" : ""
                }`}
              >
                <MathRenderer text={optionText} />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Renders the question detail (diagram, text, meta, options) in read-only form,
 * highlighting correct vs user answer for MCQ, or showing numeric answer, etc.
 */
function QuestionReviewBlock({
  question,
  userAnswer,
}: {
  question: QuestionType
  userAnswer: string | null
}) {
  const isChoice =
    question.type === "Multiple Choice" || question.type === "Multiple Correct"
  const correctAnswer = displayCorrectAnswer(question)

  return (
    <div className="mt-3">
      {renderQuestionMeta(question)}

      <div className="mt-3">{renderDiagram(question.diagramUrl)}</div>

      {question.text && (
        <div className="latex-font mb-4 max-w-[70ch] text-base leading-7 sm:text-lg">
          <MathRenderer text={question.text} />
        </div>
      )}

      {isChoice && question.options ? (
        <>
          {renderOptions(question, userAnswer)}
          {question.type === "Multiple Correct" && (
            <p className="type-data mt-2 text-xs text-pencil">
              Correct options: <span className="text-ink">{correctAnswer}</span>
            </p>
          )}
        </>
      ) : question.type === "Subjective" ? (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <PaperEyebrow>Your answer</PaperEyebrow>
            <div className="latex-font mt-1 whitespace-pre-wrap rounded-md border border-rule bg-secondary p-3">
              {userAnswer ? <MathRenderer text={userAnswer} /> : "Not answered"}
            </div>
          </div>
          <div>
            <PaperEyebrow>Model answer</PaperEyebrow>
            <div className="latex-font mt-1 whitespace-pre-wrap rounded-md border border-rule p-3">
              <MathRenderer text={correctAnswer} />
            </div>
          </div>
          <p className="text-xs text-pencil">
            Subjective answers are not auto-scored — compare against the model answer.
          </p>
        </div>
      ) : (
        // Integer / Numerical
        <div className="type-data mt-4 space-y-1 text-sm text-pencil">
          <p>
            Your answer:{" "}
            <span className="text-ink">{displayUserAnswer(question, userAnswer)}</span>
          </p>
          <p>
            Correct answer: <span className="text-ink">{correctAnswer}</span>
          </p>
        </div>
      )}
    </div>
  )
}

/** The main default export: the post-exam marksheet. */
export default function AdvancedExamResults({
  examResults,
  onStartNewExam,
  onExit,
}: {
  examResults: ExamResultsType
  onStartNewExam: () => void
  onExit: () => void
}) {
  const [difficultyFilter, setDifficultyFilter] =
    useState<"All" | "Easy" | "Medium" | "Hard">("All")

  // Filter by difficulty, if user wants
  const filteredQuestions = useMemo(() => {
    if (difficultyFilter === "All") return examResults.questions
    return examResults.questions.filter(
      (q) => (q.difficulty || "") === difficultyFilter
    )
  }, [examResults.questions, difficultyFilter])

  // Sort topicPerformance by topic name (A→Z)
  const sortedTopicPerformance = useMemo(() => {
    return Object.entries(examResults.topicPerformance).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  }, [examResults.topicPerformance])

  // Sort incorrectAnswers by topic name (A→Z)
  const sortedTopicWiseIncorrect = useMemo(() => {
    return Object.entries(examResults.topicWiseIncorrectAnswers).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  }, [examResults.topicWiseIncorrectAnswers])

  /** Build PDF content */
  function generatePdfContent() {
    const content = document.createElement("div")
    content.innerHTML = `
      <h1 style="font-size:1.25rem; margin-bottom:1rem;">Exam Results</h1>
      <p>Total Questions: ${examResults.totalQuestions}</p>
      <p>Correct Answers: ${examResults.correctAnswersCount}</p>
      <p>Incorrect Answers: ${examResults.incorrectAnswers}</p>
      <p>Score: ${examResults.score.toFixed(2)}%</p>
      <p>Average Time per Question: ${formatTime(
        Math.round(examResults.averageTimePerQuestion)
      )}</p>
      <!-- You can also add more data: topicPerformance, etc. -->
    `
    return content
  }

  function handleDownloadPdf() {
    // Example usage with html2pdf (just a quick snippet)
    const content = generatePdfContent()
    const options = {
      margin: 10,
      filename: "exam_results.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }
    html2pdf().from(content).set(options).save()
  }

  // Marksheet header data (derived from the paper itself, render-only)
  const firstQuestion = examResults.questions[0]
  const paperTitle =
    [firstQuestion?.exam, firstQuestion?.year].filter(Boolean).join(" · ") ||
    "Mock exam"
  const totalTimeSeconds = examResults.timeSpentPerQuestion.reduce(
    (a, b) => a + b,
    0
  )
  const attemptDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  // The main return
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* ---------- THE MARKSHEET ---------- */}
      <div className="paper-sheet ruled-margin p-5 pl-10 sm:p-8 sm:pl-16">
        {/* header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <PaperEyebrow>Scorecard</PaperEyebrow>
            <h1 className="type-display mt-1 text-3xl sm:text-4xl">{paperTitle}</h1>
            <p className="type-data mt-1 text-xs text-pencil">
              Attempted {attemptDate}
            </p>
          </div>
          <Button variant="outline" className="min-h-11" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* the total */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-display text-5xl sm:text-6xl">
              {examResults.score.toFixed(1)}
              <span className="ml-1 align-baseline text-2xl text-pencil">%</span>
            </p>
            <p className="type-data mt-2 text-sm text-pencil">
              {examResults.correctAnswersCount}/{examResults.gradedQuestions} correct
              <MarksChip
                className="ml-3 text-sm"
                positive={examResults.correctAnswersCount}
                negative={examResults.incorrectAnswers}
              />
            </p>
          </div>
          <div className="type-data text-sm text-pencil sm:text-right">
            <p>
              Time taken{" "}
              <span className="text-ink">{formatTime(totalTimeSeconds)}</span>
            </p>
            <p className="mt-1">
              Avg per question{" "}
              <span className="text-ink">
                {formatTime(Math.round(examResults.averageTimePerQuestion))}
              </span>
            </p>
          </div>
        </div>
        <Progress value={examResults.score} className="mt-4 h-1 w-full bg-rule" />
        {examResults.ungradedQuestions > 0 && (
          <p className="type-data mt-2 text-xs text-pencil">
            {examResults.ungradedQuestions} subjective{" "}
            {examResults.ungradedQuestions === 1 ? "answer" : "answers"} not
            auto-graded — score is out of {examResults.gradedQuestions} graded
            questions.
          </p>
        )}

        {/* counterfoil: marks by topic, ledger rows */}
        <div className="counterfoil mt-8 pt-5">
          <PaperEyebrow className="mb-1">Marks by topic</PaperEyebrow>
          {sortedTopicPerformance.map(([topic, performance]) => {
            const percent = (performance.correct / performance.total) * 100
            return (
              <div key={topic} className="ledger-row">
                <span className="min-w-0 flex-1 truncate text-sm">{topic}</span>
                <Progress
                  value={percent}
                  className="hidden h-1 w-28 flex-none bg-rule sm:block"
                />
                <span className="type-data w-12 flex-none text-right text-sm">
                  {percent.toFixed(0)}%
                </span>
                <MarksChip
                  className="w-20 flex-none text-right"
                  positive={performance.correct}
                  negative={performance.total - performance.correct}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------- strengths & revision list ---------- */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper-sheet p-6">
          <PaperEyebrow>Strong topics</PaperEyebrow>
          <div className="mt-2">
            {examResults.topStrengths.map(([topic, performance]) => (
              <div key={topic} className="ledger-row">
                <span className="min-w-0 flex-1 truncate text-sm">{topic}</span>
                <span className="type-data flex-none text-sm">
                  {((performance.correct / performance.total) * 100).toFixed(0)}%
                </span>
                <MarksChip
                  className="flex-none"
                  positive={performance.correct}
                  negative={performance.total - performance.correct}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="paper-sheet p-6">
          <PaperEyebrow>Revise these</PaperEyebrow>
          <div className="mt-2">
            {examResults.topWeaknesses.map(([topic, performance]) => (
              <div key={topic} className="ledger-row">
                <span className="min-w-0 flex-1 truncate text-sm">{topic}</span>
                <span className="type-data flex-none text-sm">
                  {((performance.correct / performance.total) * 100).toFixed(0)}%
                </span>
                <MarksChip
                  className="flex-none"
                  positive={performance.correct}
                  negative={performance.total - performance.correct}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- charts, on plain paper ---------- */}
      <div className="paper-sheet p-6">
        <PaperEyebrow>Topic performance</PaperEyebrow>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Pie
              data={{
                labels: sortedTopicPerformance.map(([topic]) => topic),
                datasets: [
                  {
                    data: sortedTopicPerformance.map(([_, p]) => p.correct),
                    backgroundColor: [
                      "rgba(255, 99, 132, 0.8)",
                      "rgba(54, 162, 235, 0.8)",
                      "rgba(255, 206, 86, 0.8)",
                      "rgba(75, 192, 192, 0.8)",
                      "rgba(153, 102, 255, 0.8)",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" },
                  title: { display: true, text: "Correct answers by topic" },
                },
              }}
            />
          </div>
          <ScrollArea className="h-75 pr-4">
            <div className="space-y-5">
              {sortedTopicPerformance.map(([topic, performance]) => {
                const percent = (performance.correct / performance.total) * 100
                return (
                  <div key={topic}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="min-w-0 flex-1 truncate">{topic}</span>
                      <span className="type-data flex-none">
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={percent} className="h-1 bg-rule" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="paper-sheet p-6">
        <PaperEyebrow>Wrong answers by topic</PaperEyebrow>
        <div className="mt-4">
          <Bar
            data={{
              labels: sortedTopicWiseIncorrect.map(([topic]) => topic),
              datasets: [
                {
                  label: "Wrong answers",
                  data: sortedTopicWiseIncorrect.map(([_, val]) => val),
                  backgroundColor: "rgba(255, 99, 132, 0.8)",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" as const },
                title: {
                  display: true,
                  text: "Wrong answers by topic (A→Z)",
                },
              },
            }}
          />
        </div>
      </div>

      {/* ---------- answer review ---------- */}
      <div className="paper-sheet p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PaperEyebrow>Answer review</PaperEyebrow>
            <h2 className="type-display mt-1 text-2xl">Question by question</h2>
          </div>

          {/* difficulty filter */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by difficulty">
            {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => {
              const isSelected = difficultyFilter === diff
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficultyFilter(diff)}
                  aria-pressed={isSelected}
                  className={`min-h-11 rounded-md border px-4 text-sm transition-colors ${
                    isSelected
                      ? "border-ink bg-paper font-medium text-ink"
                      : "border-rule bg-transparent text-pencil hover:border-pencil"
                  }`}
                >
                  {diff}
                </button>
              )
            })}
          </div>
        </div>

        <ScrollArea className="mt-4 h-100">
          <Accordion type="single" collapsible className="w-full">
            {filteredQuestions.map((question, index) => {
              // userAnswers / timeSpentPerQuestion are indexed by the
              // ORIGINAL question order, so map back through the
              // unfiltered list (the difficulty filter reorders these).
              const originalIndex = examResults.questions.indexOf(question)
              const userA = examResults.userAnswers[originalIndex] || null
              const grade = gradeAnswer(question, userA)
              const timeSpent = examResults.timeSpentPerQuestion[originalIndex]

              return (
                <AccordionItem
                  value={`question-${index}`}
                  key={question.id || `q-${index}`}
                >
                  <AccordionTrigger className="min-h-11">
                    <div className="flex flex-1 items-center gap-3 text-left">
                      <OmrBubble
                        filled={grade !== null}
                        verdict={
                          grade === null ? undefined : grade ? "correct" : "wrong"
                        }
                        status={grade === null ? "notvisited" : undefined}
                      >
                        {index + 1}
                      </OmrBubble>
                      <span className="text-sm">Question {index + 1}</span>
                      {question.difficulty && (
                        <span className="type-data text-xs text-pencil">
                          {question.difficulty}
                        </span>
                      )}
                      {question.topic && (
                        <span className="hidden truncate text-xs text-pencil sm:inline">
                          {question.topic}
                        </span>
                      )}
                      <span
                        className={`type-data ml-auto mr-2 flex-none text-xs ${
                          grade === false ? "text-redpen" : "text-pencil"
                        }`}
                      >
                        {grade === null ? "Not graded" : grade ? "Correct" : "Wrong"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <QuestionReviewBlock question={question} userAnswer={userA} />

                    <p className="type-data mt-3 text-xs text-pencil">
                      Time spent {formatTime(timeSpent)}
                    </p>

                    {question.explanation && (
                      <div className="counterfoil mt-3 pt-3 text-sm">
                        <PaperEyebrow className="mb-1">Explanation</PaperEyebrow>
                        <div className="latex-font">
                          {typeof question.explanation === "string" ? (
                            <MathRenderer text={question.explanation} />
                          ) : (
                            JSON.stringify(question.explanation)
                          )}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </ScrollArea>
      </div>

      {/* ---------- bottom CTAs ---------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <Button variant="outline" className="min-h-11" onClick={onExit}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to paper
        </Button>
        <Button className="min-h-11" onClick={onStartNewExam}>
          Start new exam
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
