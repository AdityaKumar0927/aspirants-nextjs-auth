"use client";

import React, { useReducer, useEffect, useMemo, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ArrowRight } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

enum QuestionStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
  UNDER_REVIEW = "UNDER_REVIEW"
}

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
  status: QuestionStatus;
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

type StateType = {
  questions: QuestionType[];
  filters: FiltersType;
  searchQuery: string;
  dropdowns: {
    exam: boolean;
    subject: boolean;
    topic: boolean;
    subtopic: boolean;
    difficulty: boolean;
    year: boolean;
    type: boolean;
  };
  feedback: Record<string, string>;
  numericalAnswers: Record<string, string>;
  showMarkscheme: Record<string, boolean>;
  selectedOptions: Record<string, string>;
  notes: Record<string, string>;
  loading: boolean;
  currentPage: number;
};

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DROPDOWN"; payload: { tag: keyof FiltersType; value: boolean } }
  | { type: "SET_FEEDBACK"; payload: Record<string, string> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string> }
  | { type: "SET_NOTES"; payload: Record<string, string> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_PAGE"; payload: number };

const initialState: StateType = {
  questions: [],
  filters: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    types: [],
    years: [],
    status: "all",
  },
  searchQuery: "",
  dropdowns: {
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
  },
  feedback: {},
  numericalAnswers: {},
  showMarkscheme: {},
  selectedOptions: {},
  notes: {},
  loading: true,
  currentPage: 1,
};

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_DROPDOWN":
      return {
        ...state,
        dropdowns: { ...state.dropdowns, [action.payload.tag]: action.payload.value },
      };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload };
    case "SET_NUMERICAL_ANSWERS":
      return { ...state, numericalAnswers: action.payload };
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload };
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    default:
      return state;
  }
}

const GuestQuestionBank: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await fetch("/api/questions");
      if (!response.ok) throw new Error("Failed to fetch questions");
      const questions = await response.json();
      dispatch({ type: "SET_QUESTIONS", payload: questions });
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again later.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const filteredQuestions = useMemo(() => {
    return state.questions.filter((question) => {
      const searchQuery = state.searchQuery.toLowerCase();
      const matchesSearch =
        question.text.toLowerCase().includes(searchQuery) ||
        question.topic.toLowerCase().includes(searchQuery) ||
        question.subtopic.toLowerCase().includes(searchQuery) ||
        question.subject.toLowerCase().includes(searchQuery);

      const matchesFilters =
        (!state.filters.exams.length || state.filters.exams.includes(question.exam)) &&
        (!state.filters.subjects.length ||
          state.filters.subjects.includes(question.subject)) &&
        (!state.filters.topics.length || state.filters.topics.includes(question.topic)) &&
        (!state.filters.subtopics.length ||
          state.filters.subtopics.includes(question.subtopic)) &&
        (!state.filters.difficulties.length ||
          state.filters.difficulties.includes(question.difficulty)) &&
        (!state.filters.years.length || state.filters.years.includes(question.year)) &&
        (!state.filters.types.length || state.filters.types.includes(question.type));

      return matchesSearch && matchesFilters;
    });
  }, [state.questions, state.filters, state.searchQuery]);

  const paginatedQuestions = useMemo(() => {
    const endIndex = state.currentPage * PAGE_SIZE;
    return filteredQuestions.slice(0, endIndex);
  }, [filteredQuestions, state.currentPage]);

  const handleLoadMore = useCallback(() => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: state.currentPage + 1 });
  }, [state.currentPage]);

  const handleMarkForReview = useCallback(
    async (questionId: string): Promise<void> => {
      return Promise.resolve();
    },
    []
  );
  
  const handleMarkComplete = useCallback(
    async (questionId: string): Promise<void> => {
      return Promise.resolve();
    },
    []
  );
  
  const handleNoteChange = useCallback(
    async (questionId: string, note: string): Promise<void> => {
      return Promise.resolve();
    },
    []
  );

  const handleFilterChange = useCallback(
    (tag: keyof FiltersType, value: string) => {
      const filterValues = state.filters[tag];
      if (Array.isArray(filterValues)) {
        const isSelected = filterValues.includes(value);
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value];
        dispatch({
          type: "SET_FILTERS",
          payload: { ...state.filters, [tag]: updatedFilter },
        });
      }
    },
    [state.filters]
  );

  const handleOptionClick = useCallback(
    (questionId: string, option: string, correctOption: string) => {
      const isCorrect = option === correctOption;
      const newFeedback = { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" };
      const newSelectedOptions = { ...state.selectedOptions, [questionId]: option };

      dispatch({ type: "SET_FEEDBACK", payload: newFeedback });
      dispatch({ type: "SET_SELECTED_OPTIONS", payload: newSelectedOptions });
    },
    [state.feedback, state.selectedOptions]
  );

  const handleNumericalSubmit = useCallback(
    (questionId: string, userAnswer: string, correctAnswer: string) => {
      const isCorrect = userAnswer === correctAnswer;
      const newFeedback = { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" };
      dispatch({ type: "SET_FEEDBACK", payload: newFeedback });
    },
    [state.feedback]
  );

  const handleDeleteNote = useCallback(
    async (questionId: string): Promise<void> => {
      const newNotes = { ...state.notes };
      delete newNotes[questionId];
      dispatch({ type: "SET_NOTES", payload: newNotes });
      return Promise.resolve();
    },
    [state.notes]
  );

  if (state.loading) {
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
        <Card className="mb-6 border-none bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Info className="h-5 w-5 text-blue-700" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-blue-900">Guest Access</h3>
            <p className="text-sm text-blue-700">
              Try out the Question Bank features. Sign in to save your progress.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
          <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
            Question Bank
          </h1>

          <div className="flex space-x-4 mb-6">
            <Input
              type="text"
              placeholder="Search questions..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
              className="max-w-sm"
            />
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
              <Popover
                key={filterType}
                content={
                  <div className="w-full bg-white rounded-md p-2 sm:w-40">
                    {Array.from(
                      new Set(
                        state.questions.map((q) => {
                          switch (filterType) {
                            case "exams":
                              return q.exam;
                            case "subjects":
                              return q.subject;
                            case "topics":
                              return q.topic;
                            case "subtopics":
                              return q.subtopic;
                            case "difficulties":
                              return q.difficulty;
                            case "years":
                              return q.year;
                            case "types":
                              return q.type;
                            default:
                              return "";
                          }
                        })
                      )
                    ).map((value: string) => (
                      <div key={value} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${filterType}-${value}`}
                          className="mr-2"
                          checked={
                            (state.filters[filterType as keyof FiltersType] as string[] ||
                              []
                            ).includes(value)
                          }
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
                openPopover={state.dropdowns[filterType as keyof typeof state.dropdowns]}
                
                setOpenPopover={(open) => {
                  dispatch({
                    type: "SET_DROPDOWN",
                    payload: { tag: filterType as keyof FiltersType, value: !!open },
                  });
                }}
              >
                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch({
                      type: "SET_DROPDOWN",
                      payload: {
                        tag: filterType as keyof FiltersType,
                        value: !state.dropdowns[filterType as keyof typeof state.dropdowns],
                      },
                    })
                  }
                  className="w-full sm:w-36"
                >
                  <span className="mr-2">
                    {Array.isArray(state.filters[filterType as keyof FiltersType]) &&
                    (state.filters[filterType as keyof FiltersType] as string[]).length
                      ? `${
                          (state.filters[filterType as keyof FiltersType] as string[])
                            .length
                        } selected`
                      : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      state.dropdowns[filterType as keyof typeof state.dropdowns]
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </Button>
              </Popover>
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
                  handleOptionClick={handleOptionClick}
                  handleNumericalSubmit={handleNumericalSubmit}
                  handleNumericalChange={(questionId, value) =>
                    dispatch({
                      type: "SET_NUMERICAL_ANSWERS",
                      payload: { ...state.numericalAnswers, [questionId]: value },
                    })
                  }
                  handleMarkschemeToggle={() =>
                    dispatch({
                      type: "SET_SHOW_MARKSCHEME",
                      payload: {
                        ...state.showMarkscheme,
                        [question.questionId]: !state.showMarkscheme[question.questionId],
                      },
                    })
                  }
                  handleMarkForReview={handleMarkForReview}
                  handleMarkComplete={handleMarkComplete}
                  isMarkedForReview={false}
                  isMarkedComplete={false}
                  markschemesDisabled={false}
                  note=""
                  handleNoteChange={handleNoteChange}
                  handleDeleteNote={handleDeleteNote}
                  totalQuestions={filteredQuestions.length}
                  currentQuestionIndex={paginatedQuestions.indexOf(question)}
                  handleQuestionChange={(index) => {
                    const newPage = Math.floor(index / PAGE_SIZE) + 1;
                    if (newPage !== state.currentPage) {
                      dispatch({ type: "SET_CURRENT_PAGE", payload: newPage });
                    }
                  }}
                  userId="guest"
                />
              ))}
              {paginatedQuestions.length < filteredQuestions.length && (
                <Button variant="outline" onClick={handleLoadMore} className="mt-4">
                  Load More
                </Button>
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

export default GuestQuestionBank;