"use client"

import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "katex/dist/katex.min.css";
import Question from "@/components/shared/Question";
import Modal from "@/components/shared/modal";
import MathRenderer from "@/components/layout/MathRenderer";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";

interface QuestionType {
  exam: string;
  questionId: string;
  text: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  notes?: string;
  lastAttempted?: string;
}

type FiltersType = {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  types: string[];
  years: string[];
  status: string;
};

type UserPerformance = {
  accuracy: number;
  weaknessBySubtopic: { subtopic: string; weakness: number }[];
  improvementOverTime: { date: string; improvement: number }[];
  attemptRate: number;
  firstAttemptSuccessRate: number;
  reattemptAccuracy: number;
  topicPerformance: { topic: string; performance: number }[];
  consistency: number;
  engagementLevel: number;
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  completed: number;
  reviewed: number;
};

const initialFilters: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  types: [],
  years: [],
  status: "all",
};

const isStringArray = (value: any): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

const fetchQuestions = async () => {
  const response = await fetch("/api/questions");
  if (!response.ok) throw new Error("Failed to fetch questions");
  return response.json();
};

const fetchUserProgress = async () => {
  const response = await fetch("/api/user-progress");
  if (!response.ok) throw new Error("Failed to fetch user progress");
  return response.json();
};

const fetchNotes = async () => {
  const response = await fetch("/api/notes");
  if (!response.ok) throw new Error("Failed to fetch notes");
  return response.json();
};

const updateUserPerformance = async (userId: string, questionId: string, updatedFields: Partial<UserPerformance>) => {
  try {
    const response = await fetch(`/api/user-performance/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId, ...updatedFields }),
    });
    if (!response.ok) throw new Error('Failed to update user performance');
  } catch (error) {
    console.error('Error updating user performance:', error);
  }
};

const updateUserProgress = async (userId: string, questionId: string, updatedFields: Partial<QuestionType>) => {
  try {
    const response = await fetch(`/api/user-progress/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId, ...updatedFields }),
    });
    if (!response.ok) throw new Error('Failed to update user progress');
  } catch (error) {
    console.error('Error updating user progress:', error);
  }
};

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const [dropdowns, setDropdowns] = useState({
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
  });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [markschemeContent, setMarkschemeContent] = useState<string>("");
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const userId = ""; // Add logic to retrieve user ID if signed in

  useEffect(() => {
    const fetchData = async () => {
      try {
        const questionsData = await fetchQuestions();
        const userProgressData = await fetchUserProgress();
        const notesData = await fetchNotes();

        const mergedQuestions = questionsData.map((question: QuestionType) => {
          const progress = userProgressData.find((p: any) => p.questionId === question.questionId);
          const note = notesData.find((n: any) => n.questionId === question.questionId);
          return {
            ...question,
            reviewed: progress ? progress.reviewed : false,
            completed: progress ? progress.completed : false,
            notes: note ? note.content : "",
            lastAttempted: progress ? progress.lastAttempted : "",
          };
        });
        setQuestions(mergedQuestions);
        setFilteredQuestions(mergedQuestions);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userId]);

  const exams = Array.from(new Set(questions.map((q) => q.exam)));
  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const topics = Array.from(new Set(questions.map((q) => q.topic)));
  const subtopics = Array.from(new Set(questions.map((q) => q.subtopic)));
  const difficulties = Array.from(new Set(questions.map((q) => q.difficulty)));
  const years = Array.from(new Set(questions.map((q) => q.year)));
  const types = Array.from(new Set(questions.map((q) => q.type)));

  const filterQuestions = useCallback(() => {
    let filtered = questions.filter((question) => {
      return (
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year)) &&
        (!filters.types.length || filters.types.includes(question.type))
      );
    });

    if (filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed);
    } else if (filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed);
    }

    setFilteredQuestions(filtered);
  }, [questions, filters]);

  useEffect(() => {
    filterQuestions();
  }, [filterQuestions]);

  const handleFilterChange = (tag: keyof FiltersType, value: string) => {
    setFilters((prevFilters) => {
      const filterValues = prevFilters[tag];
      if (isStringArray(filterValues)) {
        const isSelected = filterValues.includes(value);
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value];
        return { ...prevFilters, [tag]: updatedFilter };
      }
      return prevFilters;
    });
  };

  const handleDropdownToggle = (filterType: keyof typeof dropdowns) => {
    setDropdowns((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const handleMarkComplete = async (questionId: string, isComplete: boolean) => {
    await updateUserPerformance(userId, questionId, { completed: isComplete ? 1 : -1 });

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.questionId === questionId ? { ...q, completed: isComplete } : q
      )
    );
  };

  const handleMarkForReview = async (questionId: string, isReviewed: boolean) => {
    await updateUserPerformance(userId, questionId, { reviewed: isReviewed ? 1 : -1 });

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.questionId === questionId ? { ...q, reviewed: isReviewed } : q
      )
    );
  };

  const handleOptionClick = async (questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });
    await updateUserProgress(userId, questionId, { lastAttempted: new Date().toISOString() });
  };

  const handleNumericalSubmit = async (questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });
    await updateUserProgress(userId, questionId, { lastAttempted: new Date().toISOString() });
  };

  const handleNoteChange = async (questionId: string, note: string) => {
    setNotes({
      ...notes,
      [questionId]: note,
    });

    try {
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, content: note }),
      });
      if (!response.ok) throw new Error('Failed to save note');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (questionId: string) => {
    try {
      const response = await fetch('/api/notes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      });
      if (!response.ok) throw new Error('Failed to delete note');
    } catch (error) {
      console.error('Error deleting note:', error);
    }

    setNotes((prevNotes) => {
      const updatedNotes = { ...prevNotes };
      delete updatedNotes[questionId];
      return updatedNotes;
    });
  };

  return (
    <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
      <div className="max-w-6xl w-full">
        <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
          Question Bank
        </h1>

        <div className="flex space-x-4 mb-6"></div>

        <div className="flex space-x-4 mb-2">
          {["all", "complete", "review"].map((status) => (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status })}
              className={`px-4 py-2 rounded-md ${
                filters.status === status
                  ? "bg-white border hover:border-black border-gray-600 text-gray-500"
                  : "bg-white hover:border-black border border-gray-300 text-gray-500"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
          {["exam", "subject", "topic", "subtopic", "difficulty", "year", "type"].map((filterType) => (
            <Popover
              key={filterType}
              content={
                <div className="w-full bg-white rounded-md p-2 sm:w-40">
                  {(filterType === "exam"
                    ? exams
                    : filterType === "subject"
                    ? subjects
                    : filterType === "topic"
                    ? topics
                    : filterType === "subtopic"
                    ? subtopics
                    : filterType === "difficulty"
                    ? difficulties
                    : filterType === "year"
                    ? years
                    : types
                  ).map((value: string) => (
                    <div key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${filterType}-${value}`}
                        className="mr-2"
                        checked={(filters[filterType as keyof FiltersType] as string[] || []).includes(value)}
                        onChange={() => handleFilterChange(filterType as keyof FiltersType, value)}
                      />
                      <label
                        htmlFor={`${filterType}-${value}`}
                        className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              }
              align="start"
              openPopover={dropdowns[filterType as keyof typeof dropdowns]}
              setOpenPopover={(open) => handleDropdownToggle(filterType as keyof typeof dropdowns)}
            >
              <button
                onClick={() => handleDropdownToggle(filterType as keyof typeof dropdowns)}
                className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 bg-white transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
              >
                <p className="text-gray-600">
                  {isStringArray(filters[filterType as keyof FiltersType])
                    ? (filters[filterType as keyof FiltersType] as string[]).length
                      ? `${(filters[filterType as keyof FiltersType] as string[]).length} selected`
                      : filterType.charAt(0).toUpperCase() + filterType.slice(1)
                    : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </p>
                <ChevronDown
                  className={`h-4 w-4 text-gray-600 transition-all ${
                    dropdowns[filterType as keyof typeof dropdowns]
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            </Popover>
          ))}
        </div>

        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <Question
              key={question.questionId}
              question={question}
              feedback={feedback[question.questionId]}
              numericalAnswer={numericalAnswers[question.questionId]}
              showMarkscheme={showMarkscheme[question.questionId]}
              handleOptionClick={(questionId, option, correctOption) =>
                handleOptionClick(questionId, option, correctOption)
              }
              handleNumericalSubmit={handleNumericalSubmit}
              handleNumericalChange={(questionId, value) => {
                setNumericalAnswers({ ...numericalAnswers, [questionId]: value });
              }}
              handleMarkschemeToggle={() =>
                setShowMarkschemeModal(true)
              }
              handleMarkForReview={() => handleMarkForReview(question.questionId, !question.reviewed)}
              handleMarkComplete={() => handleMarkComplete(question.questionId, !question.completed)}
              isMarkedForReview={question.reviewed}
              isMarkedComplete={question.completed}
              markschemesDisabled={false}
              note={notes[question.questionId] || ""}
              handleNoteChange={handleNoteChange}
              userId={userId}
              handleDeleteNote={handleDeleteNote}
            />
          ))
        ) : (
          <p>No questions found with the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;
