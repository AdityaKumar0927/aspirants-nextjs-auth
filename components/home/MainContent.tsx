"use client"

import React, { useState } from 'react';
import Question from '@/components/shared/Question';
import sampleQuestions from '@/components/shared/sampleQuestions.json';

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [markedComplete, setMarkedComplete] = useState<Set<string>>(new Set());
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    setFeedback({
      ...feedback,
      [questionId]: option === correctOption ? 'correct' : correctOption === 'no answer' ? 'no answer' : 'incorrect',
    });
  };

  const handleNumericalSubmit = (questionId: string, userAnswer: string, correctAnswer: string) => {
    setFeedback({
      ...feedback,
      [questionId]: userAnswer === correctAnswer ? 'correct' : correctAnswer === 'no answer' ? 'no answer' : 'incorrect',
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
      prev.has(questionId) ? new Set([...prev].filter((id) => id !== questionId)) : new Set(prev).add(questionId)
    );
  };

  const handleMarkComplete = (questionId: string) => {
    setMarkedComplete((prev) =>
      prev.has(questionId) ? new Set([...prev].filter((id) => id !== questionId)) : new Set(prev).add(questionId)
    );
  };

  const handleOptionClickLocal = (questionId: string, option: string, correctOption: string) => {
    if (selectedOptions[questionId] === option) {
      setSelectedOptions({
        ...selectedOptions,
        [questionId]: ''
      });
      handleOptionClick(questionId, '', correctOption);
      setMarkedComplete((prev) => new Set([...prev].filter((id) => id !== questionId)));
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [questionId]: option
      });
      handleOptionClick(questionId, option, correctOption);
      setMarkedComplete((prev) => new Set(prev).add(questionId));
    }
  };

  const handleUserDashboardClick = () => {
    // handle showing user dashboard logic
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <section className="flex justify-center py-4 md:py-16">
            <div className="bg-white shadow-blue-300 rounded-lg overflow-hidden w-full max-w-4xl border-2">
              <div className="flex items-center p-4 border-b border-blue-300"></div>
              <div className="flex flex-col md:flex-row">
                <main className="w-full p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                    <span>JEE</span>
                    <i className="fas fa-chevron-right"></i>
                    <span>Mathematics</span>
                    <i className="fas fa-chevron-right"></i>
                    <span>Chapter 10 – Coordinate Geometry</span>
                  </div>
                  <h2 className="mb-2 text-center font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">Coordinate Geometry</h2>
                  <div className="p-4 rounded-lg">
                    {sampleQuestions.map((question) => (
                      <Question
                        key={question.questionId}
                        question={{
                          ...question,
                          type: question.type === 'Multiple Choice' || question.type === 'Numerical' ? question.type : 'Multiple Choice'
                        }}
                        feedback={feedback[question.questionId]}
                        numericalAnswer={numericalAnswers[question.questionId]}
                        showMarkscheme={showMarkscheme[question.questionId]}
                        handleOptionClick={(questionId, option, correctOption) =>
                          handleOptionClickLocal(questionId, option, correctOption)
                        }
                        handleNumericalSubmit={handleNumericalSubmit}
                        handleNumericalChange={handleNumericalChange}
                        handleMarkschemeToggle={handleMarkschemeToggle}
                        handleMarkForReview={handleMarkForReview}
                        handleMarkComplete={handleMarkComplete}
                        isMarkedForReview={markedForReview.has(question.questionId)}
                        isMarkedComplete={markedComplete.has(question.questionId)}
                        markschemesDisabled={false} // Add appropriate value
                        note="" // Add appropriate value
                        handleNoteChange={() => {}} // Add appropriate function
                      />
                    ))}
                  </div>
                </main>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return <>{renderView()}</>;
};

export default MainContent;
