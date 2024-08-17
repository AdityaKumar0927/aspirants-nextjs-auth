"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import MathRenderer from "@/components/layout/MathRenderer";
import Modal from "@/components/shared/modal";
import { LucideBookmark, BookOpen, LucideBot, MoreVertical } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import Image from "next/image";
import Tiptap from "@/components/layout/Tiptap";
import Chat from "@/components/shared/Chat";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import SettingsPopover from "@/components/ui/SettingsPopover";
import { MorePopover } from "@/components/layout/MorePopover";

interface CustomQuestionType {
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

interface CustomQuestionProps {
  question: CustomQuestionType;
  feedback: string | undefined;
  selectedOption: string | undefined;
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

const CustomQuestion: React.FC<CustomQuestionProps> = ({
  question,
  feedback,
  selectedOption,
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
  const [localSelectedOption, setLocalSelectedOption] = useState<string | null>(selectedOption || null);
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false);
  const [markschemeEnabled, setMarkschemeEnabled] = useState(!markschemesDisabled);
  const [showEditor, setShowEditor] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const { toast, dismiss } = useToast();
  const [notesEnabled, setNotesEnabled] = useState(true);  // Define notesEnabled state
  const [aiEnabled, setAiEnabled] = useState(true);        // Define aiEnabled state

  useEffect(() => {
    setLocalSelectedOption(selectedOption || null);
  }, [selectedOption]);

  const handleOptionClickLocal = async (option: string) => {
    if (localSelectedOption !== option) {
      setLocalSelectedOption(option);
      await handleOptionClick(question.questionId, option, question.correctOption || '');
    }
  };

  const handleNumericalSubmitLocal = async () => {
    await handleNumericalSubmit(question.questionId, numericalAnswer || '', question.correctOption || '');
  };

  const toggleMarkscheme = () => {
    setShowMarkschemeModal(!showMarkschemeModal);
    handleMarkschemeToggle(question.questionId);
  };

  const handleMarkCompleteLocal = async (questionId: string) => {
    await handleMarkComplete(questionId);
    toast({
      title: "Question Completed",
      description: `You have completed question ${questionId}.`,
      duration: 5000,
      action: <ToastAction onClick={() => undoMarkComplete(questionId)} altText="Undo">Undo</ToastAction>,
    });
  };

  const handleMarkForReviewLocal = async (questionId: string) => {
    await handleMarkForReview(questionId);
    toast({
      title: "Question Bookmarked",
      description: `You have bookmarked question ${questionId}.`,
      duration: 5000,
      action: <ToastAction onClick={() => undoMarkForReview(questionId)} altText="Undo">Undo</ToastAction>,
    });
  };

  const undoMarkComplete = async (questionId: string) => {
    await handleMarkComplete(questionId);
    dismiss();
  };

  const undoMarkForReview = async (questionId: string) => {
    await handleMarkForReview(questionId);
    dismiss();
  };

  const saveNote = async () => {
    try {
      const response = await fetch('/api/custom-notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.questionId, content: note }),
      });
      if (!response.ok) throw new Error('Failed to save note');
      toast({ title: 'Note saved successfully!' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving note:', errorMessage);
      toast({ title: 'Failed to save note', description: errorMessage });
    }
  };

  const deleteNote = async () => {
    try {
      await handleDeleteNote(question.questionId);
      toast({ title: 'Note deleted successfully!' });
      handleNoteChange(question.questionId, '');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting note:', errorMessage);
      toast({ title: 'Failed to delete note', description: errorMessage });
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col mb-6">
        <div className="border-2 rounded-lg p-4 bg-white relative w-full">
          <div className="w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
              <div className="mb-3 flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-2 space-y-2 md:space-y-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-left font-display font-bold tracking-[-0.02em] drop-shadow-sm sm:text-2xl sm:leading-[4rem]">
                      Question {question.questionId}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Question ID</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.subject}</span>
                  </TooltipTrigger>
                  <TooltipContent>Subject</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.difficulty}</span>
                  </TooltipTrigger>
                  <TooltipContent>Difficulty Level</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">{question.type}</span>
                  </TooltipTrigger>
                  <TooltipContent>Question Type</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`complete-${question.questionId}`}
                        checked={isMarkedComplete}
                        onCheckedChange={() => handleMarkCompleteLocal(question.questionId)}
                      />
                      <label htmlFor={`complete-${question.questionId}`}></label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Mark as Complete</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`relative text-xs ${isMarkedForReview ? ' text-white' : ''}`}
                      onClick={() => handleMarkForReviewLocal(question.questionId)}
                    >
                      <LucideBookmark className={`bookmark-icon ${isMarkedForReview ? 'fill-yellow-700' : 'text-yellow-700'}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Bookmark for Review</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SettingsPopover
                      markschemeEnabled={markschemeEnabled}
                      setMarkschemeEnabled={() => setMarkschemeEnabled(!markschemeEnabled)}
                      aiEnabled={aiEnabled}
                      setAiEnabled={setAiEnabled}
                      notesEnabled={notesEnabled}
                      setNotesEnabled={setNotesEnabled}
                      timerEnabled={true}
                      setTimerEnabled={() => {}}
                      hintsEnabled={true}
                      setHintsEnabled={() => {}}
                      darkModeEnabled={true}
                      setDarkModeEnabled={() => {}}
                      progressTrackingEnabled={true}
                      setProgressTrackingEnabled={() => {}}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MorePopover />
                  </TooltipTrigger>
                  <TooltipContent>More</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {question.diagramUrl && question.diagramUrl !== "" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative w-64 h-64 mb-4">
                    <Image
                      src={question.diagramUrl}
                      alt={`Diagram for question ${question.questionId}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Question Diagram</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-gray-700 mb-4">
                  <MathRenderer text={question.text} />
                </p>
              </TooltipTrigger>
              <TooltipContent>Question Text</TooltipContent>
            </Tooltip>
            {question.type === 'Numerical' && (
              <div className="mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="Write your answer here..."
                      value={numericalAnswer}
                      onChange={(e) => handleNumericalChange(question.questionId, e.target.value)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>Enter Numerical Answer</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="bg-white border-gray-400 text-gray-400 px-4 py-2 rounded mt-2" onClick={handleNumericalSubmitLocal}>
                      Submit
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Submit Answer</TooltipContent>
                </Tooltip>
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
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <button
                          className={`px-4 py-2 border-gray-500 border rounded ${
                            localSelectedOption === String.fromCharCode(65 + index)
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
                    </TooltipTrigger>
                    <TooltipContent>Select Option {String.fromCharCode(65 + index)}</TooltipContent>
                  </Tooltip>
                ))}
                {feedback && (
                  <div className={`mt-4 p-2 rounded ${feedback === 'correct' ? 'bg-green-100 text-green-700' : feedback === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? 'Incorrect, try again.' : 'No answer available'}
                  </div>
                )}
              </div>
            )}
            {localSelectedOption && markschemeEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="relative inline-flex items-center justify-center px-2 py-2 overflow-hidden text-gray-600 border border-gray-400 rounded"
                    onClick={toggleMarkscheme}
                  >
                    <span className="relative">Show Markscheme</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Show Markscheme</TooltipContent>
              </Tooltip>
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

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center mx-auto space-x-2">
                  {notesEnabled && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="text-gray-700 px-2 py-1 border border-gray-300 hover:bg-gray-200  rounded-md text-xs"
                          onClick={() => setShowEditor(!showEditor)}
                        >
                          <BookOpen className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Notes</TooltipContent>
                    </Tooltip>
                  )}
                  {aiEnabled && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="text-gray-700 px-2 py-1 border border-gray-300 hover:bg-gray-200 rounded-md text-xs"
                          onClick={() => setShowAiChat(!showAiChat)}
                        >
                          <LucideBot className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>AI Assistance</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              {showEditor && (
                <>
                  <Tiptap content={note} onUpdate={(content) => handleNoteChange(question.questionId, content)} />
                  <div className="flex justify-end mt-2 space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="bg-[#F5F4F3] text-[#0D0D0D] px-4 py-2 rounded"
                          onClick={saveNote}
                        >
                          Save Note
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Save Note</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="bg-[#F5F4F3] text-[#0D0D0D] px-4 py-2 rounded"
                          onClick={deleteNote}
                        >
                          Delete Note
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Note</TooltipContent>
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
              
            {showAiChat && aiEnabled && <div className="p-10 border-2 rounded-3x1 scroll-m-6"> <Chat questionText={question.text} /></div>}
            
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CustomQuestion;
