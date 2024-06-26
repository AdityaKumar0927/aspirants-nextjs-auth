"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Question from '@/components/shared/Question';
import sampleQuestions from '@/components/shared/sampleQuestions.json';

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [markedComplete, setMarkedComplete] = useState<string[]>([]);
  const [showUserDashboard, setShowUserDashboard] = useState(false);

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
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleMarkComplete = (questionId: string) => {
    setMarkedComplete((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleUserDashboardClick = () => {
    setShowUserDashboard(true);
  };

  const handleCloseUserDashboard = () => {
    setShowUserDashboard(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <section className="flex justify-center py-4 md:py-16">
              <div className="bg-white shadow-blue-300 rounded-lg overflow-hidden w-full max-w-4xl border-2">
                <div className="flex items-center p-4 border-b border-blue-300"></div>
                <div className="flex flex-col md:flex-row">
                  <div className="hidden md:block">
                    <Sidebar
                      onSettingsClick={handleUserDashboardClick}
                      onUserDashboardClick={handleUserDashboardClick}
                      onCloseSidebar={handleCloseUserDashboard}
                    />
                  </div>
                  <main className="w-full md:w-3/4 p-4">
                    <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                      <span>JEE</span>
                      <i className="fas fa-chevron-right"></i>
                      <span>Mathematics</span>
                      <i className="fas fa-chevron-right"></i>
                      <span>Chapter 10 – Coordinate Geometry</span>
                    </div>
                    <h2 className="text-2xl font-semibold mb-4 justify-center">Coordinate Geometry</h2>
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
                          handleOptionClick={handleOptionClick}
                          handleNumericalSubmit={handleNumericalSubmit}
                          handleNumericalChange={handleNumericalChange}
                          handleMarkschemeToggle={handleMarkschemeToggle}
                          handleMarkForReview={handleMarkForReview}
                          handleMarkComplete={handleMarkComplete}
                          isMarkedForReview={markedForReview.includes(question.questionId)}
                          isMarkedComplete={markedComplete.includes(question.questionId)}
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
          </>
        );
      default:
        return (
          <div className="bg-white text-gray-900">
            {/* Default content for other views */}
          </div>
        );
    }
  };

  return (
    <>
      {renderView()}
    </>
  );
};

export default MainContent;
