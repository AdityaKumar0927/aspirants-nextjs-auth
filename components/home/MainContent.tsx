"use client";

import React, { useState } from 'react';
import Question from '@/components/shared/Question';
import sampleQuestions from '@/components/shared/sampleQuestions.json';

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  reviewed: boolean;
  completed: boolean;
  options: string[];
  correctOption: string;
  markscheme: string;
}

const MainContent: React.FC = () => {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [markedComplete, setMarkedComplete] = useState<string[]>([]);

  const questions: QuestionType[] = sampleQuestions.map((question) => ({
    ...question,
    type: question.type as "Multiple Choice" | "Numerical",
  }));

  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    setFeedback({
      ...feedback,
      [questionId]: option === correctOption ? 'correct' : 'incorrect',
    });
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
    setMarkedForReview((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleMarkComplete = (questionId: string) => {
    setMarkedComplete((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  return (
    <section className="flex justify-center py-4 md:py-16 px-2 md:px-4">
      <div className="bg-white shadow-blue-300 rounded-lg overflow-hidden w-full max-w-4xl border-2">
        <div className="flex flex-col">
          <main className="w-full p-4">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
              <span>JEE</span>
              <span>&gt;</span>
              <span>Mathematics</span>
              <span>&gt;</span>
              <span>Chapter 10 – Coordinate Geometry</span>
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Coordinate Geometry</h2>
            <div className="p-4 rounded-lg">
              {questions.map((question) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={feedback[question.questionId]}
                  numericalAnswer={numericalAnswers[question.questionId]}
                  showMarkscheme={showMarkscheme[question.questionId]}
                  handleOptionClick={handleOptionClick}
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={handleNumericalChange}
                  handleMarkschemeToggle={handleMarkschemeToggle}
                  handleMarkForReview={handleMarkForReview}
                  handleMarkComplete={handleMarkComplete}
                  isMarkedForReview={markedForReview.includes(question.questionId)}
                  isMarkedComplete={markedComplete.includes(question.questionId)}
                  markschemesDisabled={false}
                  note=""
                  handleNoteChange={() => {}}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default MainContent;
