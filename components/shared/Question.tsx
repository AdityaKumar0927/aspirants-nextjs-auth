"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import MathRenderer from "@/components/layout/MathRenderer";
import Modal from "@/components/shared/modal";
import { LucideBookmark, Settings2, BookOpen, LucideBot } from "lucide-react";
import { Switch } from "@headlessui/react";
import Image from "next/image";
import Tiptap from "@/components/layout/Tiptap";
import Chat from "@/components/shared/Chat";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

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
  diagramUrl?: string;
}

interface QuestionProps {
  question: QuestionType;
  feedback: string | undefined;
  numericalAnswer: string | undefined;
  showMarkscheme: boolean | undefined;
  handleOptionClick: (
    questionId: string,
    option: string,
    correctOption: string
  ) => void;
  handleNumericalSubmit: (
    questionId: string,
    userAnswer: string,
    correctAnswer: string
  ) => void;
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
  handleDeleteNote: (questionId: string) => Promise<void>;
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
  userId,
  handleDeleteNote,
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
  const [showEditor, setShowEditor] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notesEnabled, setNotesEnabled] = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>(feedback);

  const { toast, dismiss } = useToast();

  useEffect(() => {
    const fetchUserAnswers = async () => {
      try {
        const response = await fetch(`/api/user-answers/${question.questionId}`);
        if (!response.ok) throw new Error('Failed to fetch user answers');
        const data = await response.json();
        if (data.selectedOption) {
          setSelectedOption(data.selectedOption);
          setFeedbackMessage(data.isCorrect ? 'correct' : 'incorrect');
        }
      } catch (error) {
        console.error('Error fetching user answers:', error);
      }
    };

    fetchUserAnswers();
  }, [question.questionId]);

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
      const response = await fetch('/api/notes/save', {
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
      await handleDeleteNote(question.questionId);
      alert('Note deleted successfully!');
      handleNoteChange(question.questionId, '');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
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

  const handleMarkCompleteLocal = async (questionId: string) => {
    await handleMarkComplete(questionId);
    saveProgress(questionId, 'completed', !isMarkedComplete);
    toast({
      title: "Question Completed",
      description: `You have completed question ${questionId}.`,
      duration: 5000,
      action: <ToastAction onClick={() => undoMarkComplete(questionId)} altText="Undo">Undo</ToastAction>,
    });
  };

  const handleMarkForReviewLocal = async (questionId: string) => {
    await handleMarkForReview(questionId);
    saveProgress(questionId, 'reviewed', !isMarkedForReview);
    toast({
      title: "Question Bookmarked",
      description: `You have bookmarked question ${questionId}.`,
      duration: 5000,
      action: <ToastAction onClick={() => undoMarkForReview(questionId)} altText="Undo">Undo</ToastAction>,
    });
  };

  const undoMarkComplete = async (questionId: string) => {
    await handleMarkComplete(questionId);
    saveProgress(questionId, 'completed', false);
    dismiss();
  };

  const undoMarkForReview = async (questionId: string) => {
    await handleMarkForReview(questionId);
    saveProgress(questionId, 'reviewed', false);
    dismiss();
  };

  return (
    <div className="flex flex-col mb-6">
      <div className="border-2 rounded-lg p-4 bg-white relative w-full">
        <div className="w-full">
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`complete-${question.questionId}`}
                  checked={isMarkedComplete}
                  onCheckedChange={() => handleMarkCompleteLocal(question.questionId)}
                />
                <label htmlFor={`complete-${question.questionId}`}></label>
              </div>
              <button
                className={`relative text-xs ${isMarkedForReview ? ' text-white' : ''}`}
                onClick={() => handleMarkForReviewLocal(question.questionId)}
              >
                <LucideBookmark className={`bookmark-icon ${isMarkedForReview ? 'fill-yellow-700' : 'text-yellow-700'}`} />
              </button>
              <button
                className="text-gray-700 px-2 py-1 rounded-md text-xs"
                onClick={toggleSettingsModal}
              >
                <Settings2 className="" />
              </button>
            </div>
          </div>
          {question.diagramUrl && question.diagramUrl !== "" && (
            <div className="relative w-64 h-64 mb-4">
              <Image
                src={question.diagramUrl}
                alt={`Diagram for question ${question.questionId}`}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
          )}
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
              {feedbackMessage && (
                <div className={`mt-4 p-2 rounded ${feedbackMessage === 'correct' ? 'bg-green-100 text-green-700' : feedbackMessage === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {feedbackMessage === 'correct' ? 'Correct!' : feedbackMessage === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
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
                        ? feedbackMessage === 'correct'
                          ? 'bg-green-100 text-green-700'
                          : feedbackMessage === 'incorrect'
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
              {feedbackMessage && (
                <div className={`mt-4 p-2 rounded ${feedbackMessage === 'correct' ? 'bg-green-100 text-green-700' : feedbackMessage === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {feedbackMessage === 'correct' ? 'Correct!' : feedbackMessage === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
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
            <div className="flex flex-col justify-center mx-auto w-full max-w-[480px] bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col text-black text-2xl text-left mb-4">
                <h2 className="text-2xl font-semibold mb-2">Settings</h2>
                <p className="text-sm text-gray-500">Adjust your preferences</p>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Volume Control</label>
                  <button
                    onClick={toggleVolumeControl}
                    className="flex justify-center items-center p-3 bg-gray-200 rounded-full focus:outline-none"
                  >
                    <span className="sr-only">Toggle Volume Control</span>
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
                  </button>
                  {showVolumeControl && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="mt-2 w-full"
                    />
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Markscheme</label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Enable Markscheme</span>
                    <Switch
                      checked={markschemeEnabled}
                      onChange={handleMarkschemeSwitch}
                      className={`${
                        markschemeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
                    >
                      <span
                        className={`${
                          markschemeEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out`}
                      />
                    </Switch>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">AI Chat</label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Enable AI Chat</span>
                    <Switch
                      checked={aiEnabled}
                      onChange={setAiEnabled}
                      className={`${
                        aiEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
                    >
                      <span
                        className={`${
                          aiEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out`}
                      />
                    </Switch>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Enable Notes</span>
                    <Switch
                      checked={notesEnabled}
                      onChange={setNotesEnabled}
                      className={`${
                        notesEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out`}
                    >
                      <span
                        className={`${
                          notesEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out`}
                      />
                    </Switch>
                  </div>
                </div>
              </div>
            </div>
          </Modal>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center mx-auto space-x-2">
                {notesEnabled && (
                  <button
                    className="text-gray-700 px-2 py-1 border border-gray-300 hover:bg-gray-200  rounded-md text-xs"
                    onClick={() => setShowEditor(!showEditor)}
                  >
                    <BookOpen className="h-5 w-5" />
                  </button>
                )}
                {aiEnabled && (
                  <button
                    className="text-gray-700 px-2 py-1 border border-gray-300 hover:bg-gray-200 rounded-md text-xs"
                    onClick={() => setShowAiChat(!showAiChat)}
                  >
                    <LucideBot className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            {showEditor && (
              <>
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
              </>
            )}
          </div>
        </div>

        {showAiChat && aiEnabled && <Chat questionText={question.text} />}
      </div>
    </div>
  );
};

export default Question;
