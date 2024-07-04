import React, { useState } from 'react';
import MathRenderer from '@/components/layout/MathRenderer';
import Modal from '@/components/shared/modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTag, faCog, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { Switch } from '@headlessui/react';
import Image from 'next/image';
import Tiptap from '@/components/layout/Tiptap';

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
  userId: string;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const handleOptionClickLocal = (option: string) => {
    if (selectedOption !== option) {
      setSelectedOption(option);
      handleOptionClick(question.questionId, option, question.correctOption || '');
      saveProgress(question.questionId, 'completed', true);
    }
  };

  const handleNumericalSubmitLocal = () => {
    handleNumericalSubmit(question.questionId, numericalAnswer || '', question.correctOption || '');
    saveProgress(question.questionId, 'completed', true);
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
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const saveNote = async () => {
    try {
      const response = await fetch('/api/saveNote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.questionId, content: note }),
      });
      if (!response.ok) throw new Error('Failed to save note');
      alert('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const deleteNote = async () => {
    try {
      const response = await fetch('/api/deleteNote', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.questionId }),
      });
      if (!response.ok) throw new Error('Failed to delete note');
      alert('Note deleted successfully!');
      handleNoteChange(question.questionId, '');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const askAi = async () => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion, context: question.text }),
      });
      if (!response.ok) throw new Error('Failed to get AI response');
      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      alert('Failed to get AI response');
    }
  };

  const saveProgress = async (questionId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/user-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, [field]: value }),
      });
      if (!response.ok) throw new Error('Failed to save progress');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  return (
    <div className="border-2 rounded-lg p-4 mb-6 bg-white">
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
            onClick={() => {
              handleMarkComplete(question.questionId);
              saveProgress(question.questionId, 'completed', !isMarkedComplete);
            }}
          >
            {isMarkedComplete ? (
              <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
            ) : (
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-700" />
            )}
          </button>
          <button
            className={`bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs ${isMarkedForReview ? 'bg-yellow-300 text-white' : ''}`}
            onClick={() => {
              handleMarkForReview(question.questionId);
              saveProgress(question.questionId, 'reviewed', !isMarkedForReview);
            }}
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
                className={`px-4 py-2 border-gray-500 border rounded ${
                  selectedOption === String.fromCharCode(65 + index)
                    ? feedback === 'correct'
                      ? 'bg-green-100 text-green-700'
                      : feedback === 'incorrect'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                    : 'bg-white text-gray-700'
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

      <Modal showModal={showSettingsModal} setShowModal={setShowSettingsModal} className="w-full">
        <div className="flex flex-col justify-center mx-auto w-full max-w-[480px] bg-white">
          <Image
            src="/background.png"
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="rounded-2xl"
          />
          <div className="flex flex-col pt-7 pr-2.5 pb-2 pl-10 w-full backdrop-blur-[22.5px]">
            <div className="flex flex-col text-white text-2xl text-left">
              <div className="text-bas" /> Settings
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col grow shrink-0 basis-0 w-fit">
                <div className="flex gap-5 justify-between text-base text-center text-black whitespace-nowrap font-[590]"></div>
                <div className="flex gap-4 mt-6 tracking-normal whitespace-nowrap"></div>
                <div className="flex gap-4 mt-4">
                  <div className="flex flex-col flex-1 whitespace-nowrap">
                    <div className="flex gap-4 text-xl font-bold tracking-normal text-center">
                      <button onClick={toggleVolumeControl} className="justify-center items-center px-5 text-black h-[68px] rounded-[100px] w-[68px] glassmorphism focus:outline-none">
                        <FontAwesomeIcon icon={faVolumeUp} />
                      </button>
                    </div>
                    {showVolumeControl && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="mt-4"
                      />
                    )}
                    <button onClick={handleMarkschemeSwitch} className="flex gap-2 p-3.5 mt-4 rounded-3xl w-8/12 glassmorphism focus:outline-none">
                      <div className="justify-center items-center px-3 w-5 h-10 text-base font-bold tracking-normal text-center text-black rounded-[100px]">
                        <div className="font-[510] leading-[129%] text-ellipsis text-black text-opacity-50">Markscheme</div>
                      </div>
                      <div className="flex flex-col justify-center mt-11 text-sm tracking-normal">
                        <Switch
                          checked={markschemeEnabled}
                          onChange={handleMarkschemeSwitch}
                          className={`${markschemeEnabled ? 'bg-red-200' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
                        >
                          <span className={`${markschemeEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform bg-white rounded-full transition`} />
                        </Switch>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <div className="mt-4">
        <Tiptap content={note} onUpdate={(content) => handleNoteChange(question.questionId, content)} />
        <div className="flex justify-end mt-2 space-x-2">
          <button
            className="bg-[#F5F4F3] text-[#0D0D0D] px-4 py-2 rounded"
            onClick={saveNote}
          >
            Save Note
          </button>
          <button
            className="bg-[#F5F4F3] text-[#0D0D0D] px-4 py-2 rounded"
            onClick={deleteNote}
          >
            Delete Note
          </button>
        </div>
      </div>

      <div className="mt-4">
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Ask a question about this problem..."
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
        />
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={askAi}
        >
          Ask AI
        </button>
        {aiResponse && (
          <div className="mt-4 p-4 border rounded bg-gray-100">
            <p><strong>AI Response:</strong> {aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Question;
