"use client";

import React, { useState } from 'react';
import MathRenderer from '@/components/layout/MathRenderer';
import Modal from '@/components/shared/modal';
import dynamic from 'next/dynamic';
import { Switch } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTag, faCog } from '@fortawesome/free-solid-svg-icons';

const RichTextEditor = dynamic(() => import('@/components/shared/RichTextEditor'), {
  ssr: false,
});

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: 'Multiple Choice' | 'Numerical';
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  notes?: string;
}

interface QuestionProps {
  question: QuestionType;
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
  markschemesDisabled: boolean;
  note: string;
  handleNoteChange: (questionId: string, note: string) => void;
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
  markschemesDisabled,
  note,
  handleNoteChange,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled);
  const [feedbackState, setFeedback] = useState<{ [key: string]: string }>({}); // Added feedback state

  const handleAttempt = () => {
    if (!isMarkedComplete) {
      handleMarkComplete(question.questionId);
    }
  };

  const handleOptionClickLocal = (option: string) => {
    if (selectedOption === option) {
      setSelectedOption(null);
      handleOptionClick(question.questionId, '', question.correctOption || '');
      setFeedback((prev: { [key: string]: string }) => ({
        ...prev,
        [question.questionId]: '',
      }));
    } else {
      setSelectedOption(option);
      handleAttempt();
      const correctOption = question.correctOption || '';
      handleOptionClick(question.questionId, option, correctOption);
    }
  };

  const handleNumericalSubmitLocal = () => {
    handleAttempt();
    const correctAnswer = question.correctOption || '';
    handleNumericalSubmit(question.questionId, numericalAnswer || '', correctAnswer);
  };

  const toggleMarkscheme = () => {
    setShowMarkschemeModal(!showMarkschemeModal);
    handleMarkschemeToggle(question.questionId);
  };

  const toggleSettingsModal = () => {
    setShowSettingsModal(!showSettingsModal);
  };

  const handleMarkschemeSwitch = () => {
    setMarkschemeEnabled(!markschemeEnabled);
    handleMarkschemeToggle(question.questionId);
  };

  return (
    <div className="border-2 rounded-lg p-4 bg-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Question {question.questionId}</span>
          <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.subject}</span>
          <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.difficulty}</span>
          <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.type}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs ${isMarkedComplete ? 'bg-green-500 text-white' : ''}`}
            onClick={() => handleMarkComplete(question.questionId)}
          >
            {isMarkedComplete ? (
              <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
            ) : (
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" />
            )}
          </button>
          <button
            className={`bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs`}
            onClick={() => handleMarkForReview(question.questionId)}
          >
            {isMarkedForReview ? (
              <FontAwesomeIcon icon={faTag} className="text-green-700" />
            ) : (
              <FontAwesomeIcon icon={faTag} />
            )}
          </button>
          <button
            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs"
            onClick={toggleSettingsModal}
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>
      <p className="text-gray-700 mb-4">
        <MathRenderer text={question.text} />
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
          {feedbackState[question.questionId] && (
            <div className={`mt-4 p-2 rounded ${feedbackState[question.questionId] === 'correct' ? 'bg-green-100 text-green-700' : feedbackState[question.questionId] === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {feedbackState[question.questionId] === 'correct' ? 'Correct!' : feedbackState[question.questionId] === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
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
                    ? feedbackState[question.questionId] === 'correct'
                      ? 'bg-green-100 text-green-700'
                      : feedbackState[question.questionId] === 'incorrect'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleOptionClickLocal(String.fromCharCode(65 + index))}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <span className="text-gray-700"><MathRenderer text={option} /></span>
            </div>
          ))}
          {feedbackState[question.questionId] && (
            <div className={`mt-4 p-2 rounded ${feedbackState[question.questionId] === 'correct' ? 'bg-green-100 text-green-700' : feedbackState[question.questionId] === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {feedbackState[question.questionId] === 'correct' ? 'Correct!' : feedbackState[question.questionId] === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
            </div>
          )}
        </div>
      )}
      <Modal showModal={showMarkschemeModal} setShowModal={setShowMarkschemeModal} className="max-w-2xl">
        <div className="w-full overflow-hidden md:max-w-2xl md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h2 className="font-display text-2xl font-bold">Markscheme</h2>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
            <p className="mb-4">
              {question.markscheme ? <MathRenderer text={question.markscheme} /> : 'No answer available'}
            </p>
          </div>
        </div>
      </Modal>
      <Modal showModal={showSettingsModal} setShowModal={setShowSettingsModal} className="max-w-sm">
        <div className="w-full overflow-hidden md:max-w-sm md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h2 className="font-display text-2xl font-bold">Settings</h2>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Enable Markscheme</span>
              <Switch
                checked={markschemeEnabled}
                onChange={handleMarkschemeSwitch}
                className={`${
                  markschemeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
              >
                <span
                  className={`${
                    markschemeEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                />
              </Switch>
            </div>
          </div>
        </div>
      </Modal>
      <div className="mt-4">
        <RichTextEditor
          value={note}
          onChange={(value: string) => handleNoteChange(question.questionId, value)}
        />
      </div>
    </div>
  );
};

export default Question;
