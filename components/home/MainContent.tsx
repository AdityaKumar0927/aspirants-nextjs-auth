"use client";

import React, { useState } from "react";
import Question from "@/components/shared/Question";
import sampleQuestions from "@/components/shared/sampleQuestions.json";

//
// 1) Updated QuestionType to match <Question> requirements:
//    - year?: number (instead of string)
//    - id: number for internal numbering
//    - options?: string[] ensures no `undefined` in the array
//
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
  year?: number;              // Was string before, now number
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
}

export default function MainContent() {
  //
  // 2) Transform sampleQuestions so year => number, add id, filter out undefined from options
  //
  const initialQuestions: QuestionType[] = (sampleQuestions as any[]).map((q, i) => ({
    ...q,
    id: i + 1, // Provide numeric ID
    year: q.year ? parseInt(q.year, 10) : undefined,
    options: q.options
      ? q.options.filter((opt: string | undefined): opt is string => !!opt)
      : undefined,
  }));

  const [questions, setQuestions] = useState<QuestionType[]>(initialQuestions);

  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    // If user clicks the same option again, de-select it
    if (selectedOptions[questionId] === option) {
      setSelectedOptions((prev) => ({ ...prev, [questionId]: "" }));
      setFeedback((prev) => ({ ...prev, [questionId]: "" }));
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: false } : q
        )
      );
    } else {
      // Otherwise, select this option
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

  const handleMarkschemeToggle = (questionId: string) => {
    setShowMarkscheme((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

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

  // Placeholder note deletion logic
  const handleDeleteNote = async (questionId: string): Promise<void> => {
    return Promise.resolve();
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-6xl w-full mx-auto p-4">
        {questions.map((question, index) => (
          <Question
            key={question.questionId}
            question={question}
            feedback={feedback[question.questionId ?? ""]}
            selectedOption={selectedOptions[question.questionId ?? ""]}
            numericalAnswer={numericalAnswers[question.questionId ?? ""]}
            showMarkscheme={showMarkscheme[question.questionId ?? ""]}
            handleOptionClick={handleOptionClick}
            handleNumericalSubmit={handleNumericalSubmit}
            handleNumericalChange={handleNumericalChange}
            handleMarkschemeToggle={handleMarkschemeToggle}
            handleMarkForReview={() => handleMarkForReview(question.questionId ?? "")}
            handleMarkComplete={() => handleMarkComplete(question.questionId ?? "")}
            isMarkedForReview={question.reviewed}
            isMarkedComplete={question.completed}
            markschemesDisabled={false}
            note=""
            handleNoteChange={() => {}}
            handleDeleteNote={handleDeleteNote}
            userId="user-id-placeholder"
            totalQuestions={questions.length}
            currentQuestionIndex={index}
            handleQuestionChange={(newIndex) => {
              console.log(`Navigating to question ${newIndex}`);
              // Add your question navigation logic here if needed
            }}
          />
        ))}
      </div>
    </div>
  );
}
