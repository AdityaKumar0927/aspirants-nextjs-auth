"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Question from "@/components/shared/Question";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

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

const fetchData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
  return response.json();
};

const PAGE_SIZE = 10;

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dropdowns, setDropdowns] = useState({
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
  });
  const [state, setState] = useState({
    feedback: {} as Record<string, string>,
    numericalAnswers: {} as Record<string, string>,
    showMarkscheme: {} as Record<string, boolean>,
    selectedOptions: {} as Record<string, string>,
    notes: {} as Record<string, string>,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        let questionsData = JSON.parse(localStorage.getItem("questionsData") || "null");

        if (!questionsData) {
          questionsData = await fetchData("/api/questions");
          localStorage.setItem("questionsData", JSON.stringify(questionsData));
        }

        setQuestions(questionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const updateLocalStorage = (questions: QuestionType[]) => {
    localStorage.setItem("questionsData", JSON.stringify(questions));
  };

  const updateQuestion = async (questionId: string, updates: Partial<QuestionType>) => {
    try {
      const response = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, ...updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update question");
      }

      const updatedQuestion = await response.json();

      setQuestions((prevQuestions) => {
        const updatedQuestions = prevQuestions.map((q) =>
          q.questionId === updatedQuestion.questionId ? updatedQuestion : q
        );
        updateLocalStorage(updatedQuestions);
        return updatedQuestions;
      });
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleOptionClick = useCallback(
    (questionId: string, option: string, correctOption: string) => {
      const isCorrect = option === correctOption;
      setState((prevState) => ({
        ...prevState,
        feedback: {
          ...prevState.feedback,
          [questionId]: isCorrect ? "correct" : "incorrect",
        },
        selectedOptions: {
          ...prevState.selectedOptions,
          [questionId]: option,
        },
      }));

      updateQuestion(questionId, {
        completed: true,
        reviewed: true,
      });
    },
    []
  );

  const handleNumericalSubmit = useCallback(
    (questionId: string, userAnswer: string, correctAnswer: string) => {
      const isCorrect = userAnswer === correctAnswer;
      setState((prevState) => ({
        ...prevState,
        feedback: {
          ...prevState.feedback,
          [questionId]: isCorrect ? "correct" : "incorrect",
        },
      }));

      updateQuestion(questionId, {
        completed: true,
        reviewed: true,
      });
    },
    []
  );

  const handleMarkForReview = useCallback(
    (questionId: string, isReviewed: boolean) => {
      updateQuestion(questionId, { reviewed: isReviewed });

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, reviewed: isReviewed } : q
        )
      );
    },
    []
  );

  const handleMarkComplete = useCallback(
    (questionId: string, isComplete: boolean) => {
      updateQuestion(questionId, { completed: isComplete });

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: isComplete } : q
        )
      );
    },
    []
  );

  const handleNoteChange = useCallback(
    (questionId: string, note: string) => {
      setState((prevState) => ({
        ...prevState,
        notes: {
          ...prevState.notes,
          [questionId]: note,
        },
      }));

      updateQuestion(questionId, { notes: note });
    },
    []
  );

  const handleDeleteNote = useCallback(
    async (questionId: string) => {
      setState((prevState) => {
        const updatedNotes = { ...prevState.notes };
        delete updatedNotes[questionId];
        return { ...prevState, notes: updatedNotes };
      });

      updateQuestion(questionId, { notes: "" });
    },
    []
  );

  const filteredQuestions = useMemo(() => {
    let filtered = questions.filter((question) => {
      return (
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year)) &&
        (!filters.types.length || filters.types.includes(question.type)) &&
        (question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.subtopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.subject.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    if (filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed);
    } else if (filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed);
    }

    return filtered;
  }, [questions, filters, searchQuery]);

  const paginatedQuestions = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * PAGE_SIZE;
    return filteredQuestions.slice(startIndex, endIndex);
  }, [filteredQuestions, currentPage]);

  const handleLoadMore = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleFilterChange = useCallback((tag: keyof FiltersType, value: string) => {
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
  }, []);

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
            {["exam", "subject", "topic", "subtopic", "difficulty", "year", "type"].map(
              (filterType) => (
                <div key={filterType} className="flex items-center space-x-2">
                  <Skeleton height={40} width={120} />
                </div>
              )
            )}
          </div>

          <div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mb-4 p-4 border rounded-md">
                <Skeleton height={20} width={"80%"} />
                <Skeleton height={20} width={"90%"} />
                <Skeleton height={20} width={"60%"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
            Question Bank
          </h1>

          <div className="flex space-x-4 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
              </TooltipTrigger>
              <TooltipContent>Search Questions</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {[
              "exams",
              "subjects",
              "topics",
              "subtopics",
              "difficulties",
              "years",
              "types",
            ].map((filterType) => (
              <Tooltip key={filterType}>
                <TooltipTrigger asChild>
                  <Popover
                    content={
                      <div className="w-full bg-white rounded-md p-2 sm:w-40">
                        {(
                          filterType === "exams"
                            ? Array.from(new Set(questions.map((q) => q.exam)))
                            : filterType === "subjects"
                            ? Array.from(new Set(questions.map((q) => q.subject)))
                            : filterType === "topics"
                            ? Array.from(new Set(questions.map((q) => q.topic)))
                            : filterType === "subtopics"
                            ? Array.from(new Set(questions.map((q) => q.subtopic)))
                            : filterType === "difficulties"
                            ? Array.from(new Set(questions.map((q) => q.difficulty)))
                            : filterType === "years"
                            ? Array.from(new Set(questions.map((q) => q.year)))
                            : Array.from(new Set(questions.map((q) => q.type)))
                        ).map((value: string) => (
                          <div key={value} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`${filterType}-${value}`}
                              className="mr-2"
                              checked={(
                                filters[filterType as keyof FiltersType] as string[] || []
                              ).includes(value)}
                              onChange={() =>
                                handleFilterChange(filterType as keyof FiltersType, value)
                              }
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
                            ? `${
                                (filters[filterType as keyof FiltersType] as string[]).length
                              } selected`
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
                </TooltipTrigger>
                <TooltipContent>
                  Select {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {paginatedQuestions.length > 0 ? (
            <>
              {paginatedQuestions.map((question) => (
                <Question
                  key={question.questionId}
                  question={question}
                  feedback={state.feedback[question.questionId]}
                  selectedOption={state.selectedOptions[question.questionId]}
                  numericalAnswer={state.numericalAnswers[question.questionId]}
                  showMarkscheme={state.showMarkscheme[question.questionId]}
                  handleOptionClick={(questionId, option, correctOption) =>
                    handleOptionClick(questionId, option, correctOption)
                  }
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={(questionId, value) => {
                    setState((prevState) => ({
                      ...prevState,
                      numericalAnswers: {
                        ...prevState.numericalAnswers,
                        [questionId]: value,
                      },
                    }));
                  }}
                  handleMarkschemeToggle={() =>
                    setState((prevState) => ({
                      ...prevState,
                      showMarkscheme: {
                        ...prevState.showMarkscheme,
                        [question.questionId]: !prevState.showMarkscheme[question.questionId],
                      },
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
                  note={state.notes[question.questionId] || ""}
                  handleNoteChange={handleNoteChange}
                  userId={""} // If user ID is required, pass it here
                  handleDeleteNote={handleDeleteNote}
                />
              ))}
              {paginatedQuestions.length < filteredQuestions.length && (
                <button
                  onClick={handleLoadMore}
                  className="mt-4 px-4 py-2 border border-black bg-white hover:bg-gray-200 translate-x-2 rounded-md"
                >
                  Load More
                </button>
              )}
            </>
          ) : (
            <p className="text-red-400">No questions found with the selected filters.</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default QuestionBank;
