"use client";

import React, { useState } from "react";
import Question from "@/components/shared/Question";
import sampleQuestions from "@/components/shared/sampleQuestions.json";

interface QuestionType {
  exam: string;
  questionId: string;
  text: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
}

const MainContent: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>(sampleQuestions as QuestionType[]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    if (selectedOptions[questionId] === option) {
      setSelectedOptions({
        ...selectedOptions,
        [questionId]: ''
      });
      setFeedback({
        ...feedback,
        [questionId]: '',
      });
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: false } : q
        )
      );
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [questionId]: option
      });
      setFeedback({
        ...feedback,
        [questionId]: option === correctOption ? 'correct' : 'incorrect',
      });
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: true } : q
        )
      );
    }
  };

  const handleNumericalSubmit = (questionId: string, userAnswer: string, correctAnswer: string) => {
    setFeedback({
      ...feedback,
      [questionId]: userAnswer === correctAnswer ? 'correct' : 'incorrect',
    });
  };

  const handleNumericalChange = (questionId: string, value: string) => {
    setNumericalAnswers({
      ...numericalAnswers,
      [questionId]: value,
    });
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

  const handleDeleteNote = async (questionId: string): Promise<void> => {
    return new Promise((resolve) => resolve());
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-6xl w-full mx-auto p-4">
        {questions.map((question, index) => (
          <Question
            key={question.questionId}
            question={question}
            feedback={feedback[question.questionId]}
            selectedOption={selectedOptions[question.questionId]} 
            numericalAnswer={numericalAnswers[question.questionId]}
            showMarkscheme={showMarkscheme[question.questionId]}
            handleOptionClick={handleOptionClick}
            handleNumericalSubmit={handleNumericalSubmit}
            handleNumericalChange={handleNumericalChange}
            handleMarkschemeToggle={handleMarkschemeToggle}
            handleMarkForReview={() => handleMarkForReview(question.questionId)}
            handleMarkComplete={() => handleMarkComplete(question.questionId)}
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
              // Logic to handle question navigation (if needed)
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MainContent;