"use client";

import React, { useState } from "react";
import Question from "@/components/shared/Question";
import sampleQuestions from "@/components/shared/sampleQuestions.json";

interface QuestionType {
  id: number;
  exam?: string;
  questionId?: string;
  text?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  type?: "Multiple Choice" | "Numerical" | string;
  year?: number; // numeric year, not string
  reviewed: boolean;
  completed: boolean;
  options?: string[];    // strictly string[], no undefined
  correctOption?: string;
  markscheme?: string;
}

export default function MainContent() {
  // Convert sampleQuestions => typed QuestionType[]
  const initialQuestions: QuestionType[] = (sampleQuestions as any[]).map((q, i) => ({
    ...q,
    id: i + 1, // numeric ID
    // If q.year is a string, parse it; otherwise undefined
    year: q.year ? parseInt(q.year, 10) : undefined,
    // Ensure `options` is strictly string[], filtering out any undefined
    options: q.options
      ? q.options.filter((opt: string | undefined): opt is string => !!opt)
      : undefined,
  }));

  const [questions, setQuestions] = useState<QuestionType[]>(initialQuestions);

  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // (A) MCQ option click
  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    // If user clicks the same option again, de-select it:
    if (selectedOptions[questionId] === option) {
      setSelectedOptions((prev) => ({ ...prev, [questionId]: "" }));
      setFeedback((prev) => ({ ...prev, [questionId]: "" }));
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: false } : q
        )
      );
    } else {
      // Otherwise, select this option and give feedback
      setSelectedOptions((prev) => ({ ...prev, [questionId]: option }));
      setFeedback((prev) => ({
        ...prev,
        [questionId]: option === correctOption ? "correct" : "incorrect",
      }));
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: true } : q
        )
      );
    }
  };

  // (B) Numerical
  const handleNumericalSubmit = (
    questionId: string,
    userAnswer: string,
    correctAnswer: string
  ) => {
    setFeedback((prev) => ({
      ...prev,
      [questionId]: userAnswer === correctAnswer ? "correct" : "incorrect",
    }));
  };

  const handleNumericalChange = (questionId: string, value: string) => {
    setNumericalAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // (C) Toggle markscheme
  const handleMarkschemeToggle = (questionId: string) => {
    setShowMarkscheme((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // (D) Flag or Complete
  const handleMarkForReview = (questionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.questionId === questionId ? { ...q, reviewed: !q.reviewed } : q
      )
    );
  };

  const handleMarkComplete = (questionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.questionId === questionId ? { ...q, completed: !q.completed } : q
      )
    );
  };

  // (E) Reset question
  // Clears feedback, selected option, numeric answers, etc. and un-flags question.
  const handleResetQuestion = (questionId: string) => {
    setFeedback((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    setSelectedOptions((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    setNumericalAnswers((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId
          ? { ...q, reviewed: false, completed: false }
          : q
      )
    );
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-6xl w-full mx-auto p-4">
        {questions.map((question, index) => (
          <Question
            key={question.questionId}
            question={question}
            // Feedback, selections, markscheme states
            feedback={feedback[question.questionId ?? ""]}
            selectedOption={selectedOptions[question.questionId ?? ""]}
            numericalAnswer={numericalAnswers[question.questionId ?? ""]}
            showMarkscheme={showMarkscheme[question.questionId ?? ""]}

            // Handlers
            handleOptionClick={handleOptionClick}
            handleNumericalSubmit={handleNumericalSubmit}
            handleNumericalChange={handleNumericalChange}
            handleMarkschemeToggle={handleMarkschemeToggle}
            handleMarkForReview={() => handleMarkForReview(question.questionId ?? "")}
            handleMarkComplete={() => handleMarkComplete(question.questionId ?? "")}
            handleResetQuestion={handleResetQuestion}

            // Flags
            isMarkedForReview={question.reviewed}
            isMarkedComplete={question.completed}
            markschemesDisabled={false}

            // Pagination-like props (unused)
            totalQuestions={questions.length}
            currentQuestionIndex={index}
            handleQuestionChange={(newIndex) => {
              console.log(`Navigating to question ${newIndex}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
