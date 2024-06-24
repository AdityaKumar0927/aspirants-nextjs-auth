"use client";

import React, { useState } from 'react';
import Latex from 'react-latex-next';

interface QuestionProps {
  question: {
    questionId: string;
    text: string;
    subject: string;
    difficulty: string;
    type: 'Multiple Choice' | 'Numerical';
    options?: string[];
    correctOption?: string;
    markscheme?: string;
  };
  feedback: string | undefined;
  numericalAnswer: string | undefined;
  showMarkscheme: boolean | undefined;
  handleOptionClick: (questionId: string, option: string, correctOption: string) => void;
  handleNumericalSubmit: (questionId: string, userAnswer: string, correctAnswer: string) => void;
  handleNumericalChange: (questionId: string, value: string) => void;
  handleMarkschemeToggle: (questionId: string) => void;
  handleMarkForReview: (questionId: string) => void;
  handleMarkComplete: (questionId: string) => void;
  isMarkedForReview: boolean;
  isMarkedComplete: boolean;
}

const Question: React.FC<QuestionProps> = ({
  question,
  feedback,
  numericalAnswer,
  showMarkscheme,
  handleOptionClick,
  handleNumericalSubmit,
  handleNumericalChange,
  handleMarkschemeToggle,
  handleMarkForReview,
  handleMarkComplete,
  isMarkedForReview,
  isMarkedComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showMarkschemeLocal, setShowMarkschemeLocal] = useState<boolean>(false);

  const handleAttempt = () => {
    if (!isMarkedComplete) {
      handleMarkComplete(question.questionId);
    }
  };

  const handleOptionClickLocal = (option: string) => {
    setSelectedOption(option);
    handleAttempt();
    const correctOption = question.correctOption || '';
    const isCorrect = option === correctOption;
    handleOptionClick(question.questionId, option, correctOption);
  };

  const handleNumericalSubmitLocal = () => {
    handleAttempt();
    const correctAnswer = question.correctOption || '';
    const isCorrect = numericalAnswer === correctAnswer;
    handleNumericalSubmit(question.questionId, numericalAnswer || '', correctAnswer);
  };

  const toggleMarkscheme = () => {
    setShowMarkschemeLocal(!showMarkschemeLocal);
    handleMarkschemeToggle(question.questionId);
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 bg-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Question {question.questionId}</span>
          <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.subject}</span>
          <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.difficulty}</span>
          <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.type}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs ${isMarkedComplete ? 'bg-green-500 text-white' : ''}`}
            onClick={() => handleMarkComplete(question.questionId)}
          >
            {isMarkedComplete ? 'Completed' : 'Complete'}
          </button>
          <button
            className={`bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs ${isMarkedForReview ? 'bg-yellow-500 text-white' : ''}`}
            onClick={() => handleMarkForReview(question.questionId)}
          >
            {isMarkedForReview ? 'Marked for Review' : 'Review'}
          </button>
        </div>
      </div>
      <p className="text-gray-700 mb-4">
        <Latex>{question.text}</Latex>
      </p>
      {question.type === 'Numerical' && (
        <div className="mb-4">
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Write your answer here..."
            value={numericalAnswer}
            onChange={(e) => handleNumericalChange(question.questionId, e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded mt-2" onClick={handleNumericalSubmitLocal}>
            Submit
          </button>
          {feedback && (
            <div className={`mt-4 p-2 rounded ${feedback === 'correct' ? 'bg-green-100 text-green-700' : feedback === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
            </div>
          )}
        </div>
      )}
      {question.type === 'Multiple Choice' && (
        <div className="space-y-2 mb-4">
          {question.options?.map((option: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <button
                className={`px-4 py-2 rounded-md ${
                  selectedOption === String.fromCharCode(65 + index)
                    ? feedback === 'correct'
                      ? 'bg-green-100 text-green-700'
                      : feedback === 'incorrect'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleOptionClickLocal(String.fromCharCode(65 + index))}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <span className="text-gray-700"><Latex>{option}</Latex></span>
            </div>
          ))}
          {feedback && (
            <div className={`mt-4 p-2 rounded ${feedback === 'correct' ? 'bg-green-100 text-green-700' : feedback === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
            </div>
          )}
        </div>
      )}
      {feedback && (
        <button className="bg-white border-2 border-blue-300 text-gray-700 px-4 py-2 rounded mt-2" onClick={toggleMarkscheme}>
          {showMarkschemeLocal ? 'Hide Markscheme' : 'Show Markscheme'}
        </button>
      )}
      {showMarkschemeLocal && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold">Markscheme</h3>
          <p className="text-gray-700">
            {question.markscheme ? <Latex>{question.markscheme}</Latex> : 'No answer available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Question;