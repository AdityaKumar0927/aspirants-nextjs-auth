// src/components/MainContent.tsx
"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Footer from '@/components/layout/footer';
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
              <main className="text-center py-16 px-4">
                <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
                  <i className="fas fa-magic"></i> Aspire. Prepare. Succeed.
                </div>
                <h1 className="text-4xl font-bold mb-4">
                  Study for CUET & JEE exams with <span className="text-blue-500">aspirants</span>
                </h1>
                <p className="text-lg text-gray-700 mb-4">
                  Thousands of practice questions, study notes, and flashcards, all in one place.
                </p>
                <div className="flex justify-center space-x-4">
                  <button className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600">
                    Try Now
                  </button>
                  <button className="bg-white-200 text-gray-700 px-6 py-3 rounded border-2 border-black hover:bg-gray-300">
                    Browse resources
                  </button>
                </div>
              </main>
              <section className="flex justify-center py-16">
                <div className="bg-white shadow-blue-300 rounded-lg overflow-hidden w-full max-w-4xl border-2">
                  <div className="flex items-center p-4 border-b border-blue-300"></div>
                  <div className="flex">
                    <Sidebar onSettingsClick={handleUserDashboardClick} onUserDashboardClick={handleUserDashboardClick} />
                    <main className="w-3/4 p-4">
                      <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                        <span>JEE</span>
                        <i className="fas fa-chevron-right"></i>
                        <span>Mathematics</span>
                        <i className="fas fa-chevron-right"></i>
                        <span>Chapter 10 – Coordinate Geometry</span>
                      </div>
                      <h2 className="text-2xl font-semibold mb-4">Coordinate Geometry</h2>
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
                          />
                        ))}
                      </div>
                    </main>
                  </div>
                </div>
              </section>
              <Footer />
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