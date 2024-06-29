import React, { useState } from "react";
import MathRenderer from "@/components/layout/MathRenderer";
import Modal from "@/components/shared/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTag, faCog } from "@fortawesome/free-solid-svg-icons";

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
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
  userId: string; // Add this line
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

  const handleOptionClickLocal = (option: string) => {
    if (selectedOption !== option) {
      setSelectedOption(option);
      handleOptionClick(question.questionId, option, question.correctOption || '');
      handleMarkComplete(question.questionId);
    }
  };

  const handleNumericalSubmitLocal = () => {
    handleNumericalSubmit(question.questionId, numericalAnswer || '', question.correctOption || '');
    handleMarkComplete(question.questionId);
  };

  const toggleMarkscheme = () => {
    setShowMarkschemeModal(!showMarkschemeModal);
    handleMarkschemeToggle(question.questionId);
  };

  const toggleSettingsModal = () => {
    setShowSettingsModal(!showSettingsModal);
  };

  return (
    <div className="border-2 rounded-lg p-4 bg-white mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <div className="mb-3 flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
          <span className="text-left font-display font-bold tracking-[-0.02em] drop-shadow-sm sm:text-2xl sm:leading-[4rem]">
            Question {question.questionId}
          </span>
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
            className={`bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs ${isMarkedForReview ? 'bg-yellow-300 text-white' : ''}`}
            onClick={() => handleMarkForReview(question.questionId)}
          >
            <FontAwesomeIcon icon={faTag} className={`${isMarkedForReview ? 'text-green-700' : 'text-yellow-700'}`} />
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
          <button className="bg-white border-gray-400 text-gray-400 px-4 py-2 rounded mt-2" onClick={handleNumericalSubmitLocal}>
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
              <span className="text-gray-700"><MathRenderer text={option} /></span>
            </div>
          ))}
          {feedback && (
            <div className={`mt-4 p-2 rounded ${feedback === 'correct' ? 'bg-green-100 text-green-700' : feedback === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
            </div>
          )}
        </div>
      )}
      {selectedOption && markschemeEnabled && (
        <button
          className="relative inline-flex items-center justify-center px-2 py-2 overflow-hidden text-gray-600 border border-gray-400 rounded"
          onClick={toggleMarkscheme}
        >
          <span className="relative">Show Markscheme</span>
        </button>
      )}
      <Modal showModal={showMarkschemeModal} setShowModal={setShowMarkschemeModal} className="max-w-2xl">
        <div className="w-full overflow-hidden md:max-w-2xl md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
            <h2 className="font-display text-2xl font-bold">Markscheme</h2>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
            <p className="mb-2">
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
              <span className="text-gray-400">Enable Markscheme</span>
            </div>
          </div>
        </div>
      </Modal>
      <div className="mt-4">
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Write your notes here..."
          value={note}
          onChange={(e) => handleNoteChange(question.questionId, e.target.value)}
        />
      </div>
    </div>
  );
};

export default Question;
