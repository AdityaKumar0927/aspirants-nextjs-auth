"use client";

import React, { useState, useEffect, useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Question from "@/components/shared/Question";
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
  diagramUrl?: string;
}

interface UserPerformance {
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  accuracy: number;
  weaknessBySubtopic: any;
  improvementOverTime: any;
  attemptRate: number;
  firstAttemptSuccessRate: number;
  reattemptAccuracy: number;
  topicPerformance: any;
  consistency: number;
  engagementLevel: number;
  completed: boolean;
  reviewed: boolean;
  lastAttempted?: string; // Add this line
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
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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

const fetchUserAnswers = async () => {
  const response = await fetch("/api/user-answers");
  if (!response.ok) throw new Error("Failed to fetch user answers");
  return response.json();
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const userId = ""; // Add logic to retrieve user ID if signed in

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const questionsData = await fetchQuestions();
        const userProgressData = await fetchUserProgress();
        const notesData = await fetchNotes();
        const userAnswersData = await fetchUserAnswers();

        const mergedQuestions = questionsData.map((question: QuestionType) => {
          const progress = userProgressData.find((p: any) => p.questionId === question.questionId);
          const note = notesData.find((n: any) => n.questionId === question.questionId);
          const userAnswer = userAnswersData.find((a: any) => a.questionId === question.questionId);
          return {
            ...question,
            reviewed: progress ? progress.reviewed : false,
            completed: progress ? progress.completed : false,
            notes: note ? note.content : "",
            lastAttempted: progress ? progress.lastAttempted : "",
            selectedOption: userAnswer ? userAnswer.selectedOption : "",
            feedback: userAnswer ? userAnswer.feedback : "",
          };
        });
        setQuestions(mergedQuestions);
        setFilteredQuestions(mergedQuestions);
        setSelectedOptions(userAnswersData.reduce((acc: any, answer: any) => {
          acc[answer.questionId] = answer.selectedOption;
          return acc;
        }, {}));
        setFeedback(userAnswersData.reduce((acc: any, answer: any) => {
          acc[answer.questionId] = answer.feedback;
          return acc;
        }, {}));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
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
  }, [filters, filterQuestions]);

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

  const updateUserPerformance = async (
    questionId: string,
    updatedFields: Partial<UserPerformance>
  ) => {
    try {
      const response = await fetch(`/api/user-performance/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, ...updatedFields }),
      });
      if (!response.ok) throw new Error("Failed to update user performance");
    } catch (error) {
      console.error("Error updating user performance:", error);
    }
  };

  const saveUserAnswer = async (questionId: string, selectedOption: string, isCorrect: boolean) => {
    try {
      const response = await fetch(`/api/user-answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOption, isCorrect }),
      });
      if (!response.ok) throw new Error("Failed to save user answer");
    } catch (error) {
      console.error("Error saving user answer:", error);
    }
  };

  const handleMarkComplete = async (questionId: string, isComplete: boolean) => {
    await updateUserPerformance(questionId, { completed: isComplete });

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, completed: isComplete } : q))
    );
  };

  const handleMarkForReview = async (questionId: string, isReviewed: boolean) => {
    await updateUserPerformance(questionId, { reviewed: isReviewed });

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, reviewed: isReviewed } : q))
    );
  };

  const handleOptionClick = async (questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });

    const updatedFields: Partial<UserPerformance> = {
      correctAnswers: isCorrect ? 1 : 0,
      incorrectAnswers: !isCorrect ? 1 : 0,
      uniqueQuestions: 1,
      questionsAttempted: 1,
      completed: true,
      timeSpent: 0, // Calculate actual time spent
      accuracy: isCorrect ? 1 : 0,
      weaknessBySubtopic: {}, // Add actual weakness data
      improvementOverTime: {}, // Add actual improvement data
      attemptRate: 1,
      firstAttemptSuccessRate: isCorrect ? 1 : 0,
      reattemptAccuracy: isCorrect ? 1 : 0,
      topicPerformance: {}, // Add actual topic performance data
      consistency: 1,
      engagementLevel: 1,
      lastAttempted: new Date().toISOString(),
    };

    await updateUserPerformance(questionId, updatedFields);
    await saveUserAnswer(questionId, option, isCorrect);

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, completed: true } : q))
    );
  };

  const handleNumericalSubmit = async (questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });

    const updatedFields: Partial<UserPerformance> = {
      completed: true,
      correctAnswers: isCorrect ? 1 : 0,
      incorrectAnswers: !isCorrect ? 1 : 0,
      uniqueQuestions: 1,
      questionsAttempted: 1,
      timeSpent: 0, // Calculate actual time spent
      accuracy: isCorrect ? 1 : 0,
      weaknessBySubtopic: {}, // Add actual weakness data
      improvementOverTime: {}, // Add actual improvement data
      attemptRate: 1,
      firstAttemptSuccessRate: isCorrect ? 1 : 0,
      reattemptAccuracy: isCorrect ? 1 : 0,
      topicPerformance: {}, // Add actual topic performance data
      consistency: 1,
      engagementLevel: 1,
      lastAttempted: new Date().toISOString(),
    };

    await updateUserPerformance(questionId, updatedFields);
    await saveUserAnswer(questionId, userAnswer, isCorrect);

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, completed: true } : q))
    );
  };

  const handleNoteChange = async (questionId: string, note: string) => {
    setNotes({
      ...notes,
      [questionId]: note,
    });

    try {
      const response = await fetch("/api/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, content: note }),
      });
      if (!response.ok) throw new Error("Failed to save note");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async (questionId: string) => {
    try {
      const response = await fetch("/api/notes/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (!response.ok) throw new Error("Failed to delete note");
    } catch (error) {
      console.error("Error deleting note:", error);
    }

    setNotes((prevNotes) => {
      const updatedNotes = { ...prevNotes };
      delete updatedNotes[questionId];
      return updatedNotes;
    });
  };

  if (loading) {
    return (
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
            Question Bank
          </h1>

          <div className="flex space-x-4 mb-6">
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {["exam", "subject", "topic", "subtopic", "difficulty", "year", "type"].map((filterType) => (
              <div key={filterType} className="flex items-center space-x-2">
                <Skeleton height={40} width={120} />
              </div>
            ))}
          </div>

          <div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mb-4 p-4 border rounded-md">
                <Skeleton height={20} width={`80%`} />
                <Skeleton height={20} width={`90%`} />
                <Skeleton height={20} width={`60%`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          {["exams", "subjects", "topics", "subtopics", "difficulties", "years", "types"].map((filterType) => (
            <Popover
              key={filterType}
              content={
                <div className="w-full bg-white rounded-md p-2 sm:w-40">
                  {(filterType === "exams"
                    ? exams
                    : filterType === "subjects"
                    ? subjects
                    : filterType === "topics"
                    ? topics
                    : filterType === "subtopics"
                    ? subtopics
                    : filterType === "difficulties"
                    ? difficulties
                    : filterType === "years"
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
              setOpenPopover={(open) => {
                setDropdowns((prev) => ({
                  ...prev,
                  [filterType]: open,
                }));
              }}
            >
              <button
                onClick={() =>
                  setDropdowns((prev) => ({
                    ...prev,
                    [filterType]: !prev[filterType as keyof typeof dropdowns],
                  }))
                }
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
                    dropdowns[filterType as keyof typeof dropdowns] ? "rotate-180" : ""
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
                setShowMarkscheme((prev) => ({
                  ...prev,
                  [question.questionId]: !prev[question.questionId],
                }))
              }
              handleMarkForReview={() =>
                handleMarkForReview(question.questionId, !question.reviewed)
              }
              handleMarkComplete={() =>
                handleMarkComplete(question.questionId, !question.completed)
              }
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
