"use client";

import React, { useReducer, useEffect, useCallback, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  List,
  Filter,
  HelpCircle,
  Flag,
} from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import Popover from "@/components/shared/popover";
import Question from "@/components/shared/Question";

// -------------------- Enums & Types --------------------
enum ViewMode {
  DESKTOP = "desktop",
  MOBILE = "mobile",
}

type QuestionTypeString = "Multiple Choice" | "Numerical" | string;

interface QuestionType {
  id: number;
  questionId: string;
  text: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  type?: QuestionTypeString;
  year?: number;
  reviewed?: boolean;
  completed?: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  notes?: string;
  diagramUrl?: string;
  exam?: string;
  customTags?: string[];   
  difficultyRating?: number;
}

type FilterKey =
  | "exams"
  | "subjects"
  | "topics"
  | "subtopics"
  | "difficulties"
  | "years"
  | "types";

type FiltersType = {
  [K in FilterKey]: string[];
} & {
  status: string; // "all"|"complete"|"review"|"incomplete"
};

type DropdownsType = {
  [K in FilterKey]: boolean;
};

interface FilterOptionsType {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  years: string[];
  types: string[];
}

interface GlobalStats {
  total: number;
  completed: number;
  reviewed: number;
  notAnswered: number;
}

type StateType = {
  questions: QuestionType[];
  filters: FiltersType;
  filterOptions: FilterOptionsType;
  searchQuery: string;
  dropdowns: DropdownsType;
  feedback: Record<string, string | undefined>;
  numericalAnswers: Record<string, string | undefined>;
  showMarkscheme: Record<string, boolean>;
  selectedOptions: Record<string, string | undefined>;
  loading: boolean;
  actionLoading: boolean;
  viewMode: ViewMode;
  currentPage: number;
  totalCount: number;
  pageSize: number;
  globalStats: GlobalStats;
};

type ActionType =
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptionsType }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DROPDOWN"; payload: { tag: FilterKey; value: boolean } }
  | { type: "SET_FEEDBACK"; payload: Record<string, string | undefined> }
  | { type: "SET_NUMERICAL_ANSWERS"; payload: Record<string, string | undefined> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string | undefined> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTION_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_TOTAL_COUNT"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_GLOBAL_STATS"; payload: GlobalStats };

// -------------------- Helper Functions --------------------
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function transformFilterItem(value: string): string {
  // Replace hyphens with spaces, then Title Case each word
  const replaced = value.replace(/-/g, " ");
  return replaced
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const transitionProps = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

// -------------------- Initial State & Reducer --------------------
const initialState: StateType = {
  questions: [],
  filters: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    years: [],
    types: [],
    status: "all",
  },
  filterOptions: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    years: [],
    types: [],
  },
  searchQuery: "",
  dropdowns: {
    exams: false,
    subjects: false,
    topics: false,
    subtopics: false,
    difficulties: false,
    years: false,
    types: false,
  },
  feedback: {},
  numericalAnswers: {},
  showMarkscheme: {},
  selectedOptions: {},
  loading: true,
  actionLoading: false,
  viewMode: ViewMode.DESKTOP,
  currentPage: 1,
  totalCount: 0,
  pageSize: 10,
  globalStats: {
    total: 0,
    completed: 0,
    reviewed: 0,
    notAnswered: 0,
  },
};

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "SET_FILTER_OPTIONS":
      return { ...state, filterOptions: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_DROPDOWN":
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          [action.payload.tag]: action.payload.value,
        },
      };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload };
    case "SET_NUMERICAL_ANSWERS":
      return { ...state, numericalAnswers: action.payload };
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload };
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload };
    case "SET_GLOBAL_STATS":
      return { ...state, globalStats: action.payload };
    default:
      return state;
  }
}

// -------------------- Pagination --------------------
function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  return (
    <nav className="flex items-center justify-center mt-6" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-4 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

// -------------------- Main Component --------------------
export default function QuestionBankContent() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const [mobileIndex, setMobileIndex] = useState(0);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  // Add a "progressOpen" for mobile progress card
  const [progressOpen, setProgressOpen] = useState(false);

  // Decide initial view mode
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE });
    }
  }, []);

  // -------------- Data Fetch --------------
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/filters", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch distinct filter fields.");
      const raw = await res.json();
      const data: FilterOptionsType = {
        exams: raw.exams ?? [],
        subjects: raw.subjects ?? [],
        topics: raw.topics ?? [],
        subtopics: raw.subtopics ?? [],
        difficulties: raw.difficulties ?? [],
        years: raw.years ?? [],
        types: raw.types ?? [],
      };
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data });
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast({
        title: "Error",
        description: "Could not load filter fields. Try again later.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const { exams, subjects, topics, subtopics, difficulties, years, types } = state.filters;
      const arrToComma = (arr: string[]) => arr.join(",");
      const params = new URLSearchParams();
      if (exams.length) params.set("exam", arrToComma(exams));
      if (subjects.length) params.set("subject", arrToComma(subjects));
      if (topics.length) params.set("topic", arrToComma(topics));
      if (subtopics.length) params.set("subtopic", arrToComma(subtopics));
      if (difficulties.length) params.set("difficulty", arrToComma(difficulties));
      if (years.length) params.set("year", arrToComma(years));
      if (types.length) params.set("type", arrToComma(types));
      const resp = await fetch(`/api/questions/stats?${params.toString()}`, { cache: "no-store" });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Failed to fetch stats: ${txt}`);
      }
      const raw = await resp.json();
      const stats: GlobalStats = {
        total: raw.total || raw.totalQuestions || 0,
        completed: raw.completed || 0,
        reviewed: raw.reviewed || 0,
        notAnswered: raw.notAnswered || 0,
      };
      dispatch({ type: "SET_GLOBAL_STATS", payload: stats });
    } catch (err) {
      console.error("Error fetching global stats:", err);
    }
  }, [state.filters]);

  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { currentPage, pageSize, filters } = state;
      const { exams, subjects, topics, subtopics, difficulties, years, types } = filters;
      const arrToComma = (arr: string[]) => arr.join(",");
      const params = new URLSearchParams();
      if (exams.length) params.set("exam", arrToComma(exams));
      if (subjects.length) params.set("subject", arrToComma(subjects));
      if (topics.length) params.set("topic", arrToComma(topics));
      if (subtopics.length) params.set("subtopic", arrToComma(subtopics));
      if (difficulties.length) params.set("difficulty", arrToComma(difficulties));
      if (years.length) params.set("year", arrToComma(years));
      if (types.length) params.set("type", arrToComma(types));
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));

      const url = `/api/questions?${params.toString()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch questions. ${txt}`);
      }
      const result = await res.json();
      let data: QuestionType[] = [];
      let totalCount = 0;

      if (Array.isArray(result)) {
        data = result;
        totalCount = data.length;
      } else if (result.data) {
        data = result.data;
        totalCount = result.totalCount;
      }
      // Sort by numeric portion of questionId
      data = data.sort((a, b) => {
        const aId = a.questionId?.match(/\d+/)?.[0] || "0";
        const bId = b.questionId?.match(/\d+/)?.[0] || "0";
        return parseInt(aId, 10) - parseInt(bId, 10);
      });
      dispatch({ type: "SET_QUESTIONS", payload: data });
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount });
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast({
        title: "Error",
        description: "Failed to load questions. Try again later.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.filters, state.currentPage, state.pageSize, toast]);

  // Initial load
  useEffect(() => {
    fetchFilterOptions();
    fetchGlobalStats();
  }, [fetchFilterOptions, fetchGlobalStats]);

  // Refresh when filters/page changes
  useEffect(() => {
    fetchQuestions();
    fetchGlobalStats();
  }, [state.filters, state.currentPage, fetchQuestions, fetchGlobalStats]);

  // -------------- Action Handlers --------------
  const handleMarkComplete = useCallback(
    async (questionId: string, newVal?: boolean) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        const val = newVal ?? true;
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, completed: val }),
        });
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: val } : q
          ),
        });
      } catch (err) {
        console.error("Error marking complete:", err);
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.questions]
  );

  const handleMarkForReview = useCallback(
    async (questionId: string, newVal?: boolean) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        const val = newVal ?? true;
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, reviewed: val }),
        });
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, reviewed: val } : q
          ),
        });
      } catch (err) {
        console.error("Error marking review:", err);
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.questions]
  );

  const handleOptionClick = useCallback(
    (questionId: string, option: string, correct: string) => {
      const isCorrect = option === correct;
      dispatch({
        type: "SET_FEEDBACK",
        payload: { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" },
      });
      dispatch({
        type: "SET_SELECTED_OPTIONS",
        payload: { ...state.selectedOptions, [questionId]: option },
      });
      dispatch({
        type: "SET_QUESTIONS",
        payload: state.questions.map((q) =>
          q.questionId === questionId ? { ...q, completed: true } : q
        ),
      });
    },
    [state.feedback, state.selectedOptions, state.questions]
  );

  const handleNumericalSubmit = useCallback(
    async (questionId: string, userAns: string, correctAns: string) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        const isCorrect = userAns === correctAns;
        dispatch({
          type: "SET_FEEDBACK",
          payload: { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" },
        });
        dispatch({
          type: "SET_NUMERICAL_ANSWERS",
          payload: { ...state.numericalAnswers, [questionId]: userAns },
        });
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, completed: true }),
        });
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: true } : q
          ),
        });
      } catch (err) {
        console.error("Error marking numeric answer:", err);
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.feedback, state.numericalAnswers, state.questions]
  );

  const handleResetQuestion = useCallback(
    async (questionId: string) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        dispatch({
          type: "SET_FEEDBACK",
          payload: { ...state.feedback, [questionId]: undefined },
        });
        dispatch({
          type: "SET_SELECTED_OPTIONS",
          payload: { ...state.selectedOptions, [questionId]: undefined },
        });
        dispatch({
          type: "SET_NUMERICAL_ANSWERS",
          payload: { ...state.numericalAnswers, [questionId]: undefined },
        });
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: false, reviewed: false } : q
          ),
        });
        await fetch("/api/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, completed: false, reviewed: false }),
        });
      } catch (err) {
        console.error("Error resetting question:", err);
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.feedback, state.selectedOptions, state.numericalAnswers, state.questions]
  );

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    const s = state.searchQuery.toLowerCase();
    return state.questions.filter((q) => {
      const textFields = [q.text, q.exam, q.subject, q.topic, q.subtopic].filter(Boolean);
      const matchesSearch = textFields.some((f) => f && fuzzyContains(f, s));
      let matchesStatus = true;
      const st = state.filters.status;
      if (st === "review" && !q.reviewed) matchesStatus = false;
      else if (st === "complete" && !q.completed) matchesStatus = false;
      else if (st === "incomplete" && q.completed) matchesStatus = false;
      return matchesSearch && matchesStatus;
    });
  }, [state.questions, state.filters.status, state.searchQuery]);

  // -------------- Mobile Progress View --------------
  // We'll reuse the same progress card. Let's define a small function:
  function ProgressCard() {
    const total = state.globalStats.total;
    const answered = state.globalStats.completed;
    const reviewed = state.globalStats.reviewed;
    const notAnswered = state.globalStats.notAnswered;
    const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;

    return (
      <Card
        className="
          bg-gradient-to-br from-gray-200 to-gray-100
          dark:from-gray-900 dark:to-gray-800
          text-gray-900 dark:text-gray-100
          border-gray-200 dark:border-gray-700
          mb-6
        "
      >
        <CardContent className="p-6">
          <h2 className="text-2xl font-light tracking-tight text-gray-800 dark:text-gray-200 mb-6">
            Question Progress
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-300">
                {progressPct}%
              </span>
            </div>
            <Progress
              value={progressPct}
              className="w-full h-1.5 bg-gray-300 dark:bg-gray-700"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* total */}
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="text-blue-400 p-2 rounded-full bg-blue-400/10">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-light tracking-tighter text-blue-600 dark:text-blue-300">
                    {total}
                  </p>
                  <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                    Total Questions
                  </p>
                </div>
              </div>
              {/* answered */}
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="text-green-400 p-2 rounded-full bg-green-400/10">
                  <svg
                    className="h-5 w-5"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-light tracking-tighter text-green-600 dark:text-green-300">
                    {answered}
                  </p>
                  <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                    Answered
                  </p>
                </div>
              </div>
              {/* flagged */}
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="text-yellow-400 p-2 rounded-full bg-yellow-400/10">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-light tracking-tighter text-yellow-600 dark:text-yellow-300">
                    {reviewed}
                  </p>
                  <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                    For Review
                  </p>
                </div>
              </div>
              {/* not answered */}
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="text-red-400 p-2 rounded-full bg-red-400/10">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-light tracking-tighter text-red-600 dark:text-red-300">
                    {notAnswered}
                  </p>
                  <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                    Not Answered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------------- Loading Skeleton --------------
  if (state.loading || state.actionLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Question Bank</h1>
          <div className="flex space-x-4 mb-6">
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
            <Skeleton height={40} width={120} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton height={40} width={120} />
              </div>
            ))}
          </div>
          <div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mb-4 p-4 border rounded-md dark:border-gray-700">
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

  // -------------- MOBILE VIEW --------------
  if (state.viewMode === ViewMode.MOBILE) {
    if (!filteredQuestions.length) {
      return (
        <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.DESKTOP })}
              className="border-gray-300 font-medium text-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              Desktop View
            </Button>
            <p className="mt-6 text-red-300">No questions found with these filters.</p>
          </div>
        </div>
      );
    }

    const currentQ = filteredQuestions[mobileIndex];
    const total = filteredQuestions.length;
    const displayNumber = mobileIndex + 1;

    return (
      <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 font-medium text-gray-700 dark:border-gray-600 dark:text-gray-100"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.DESKTOP })}
            >
              Desktop View
            </Button>
            <div className="flex items-center gap-2">
              {/* Mobile Filters */}
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 font-medium text-gray-700 dark:border-gray-600 dark:text-gray-100 flex items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="
                    fixed top-0 left-0 w-screen h-screen
                    sm:w-[500px] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    flex flex-col custom-scrollbar
                    pt-6
                  "
                >
                  <FiltersDialogMobile
                    open={filtersOpenMobile}
                    onOpenChange={setFiltersOpenMobile}
                    state={state}
                    dispatch={dispatch}
                  />
                </DialogContent>
              </Dialog>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                {displayNumber} / {total}
              </span>
            </div>
          </div>

          {/* Button to show progress in full screen modal */}
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => setProgressOpen(true)}
          >
            View Progress
          </Button>

          {/* Mobile progress dialog */}
          <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
            <DialogContent
              className="
                fixed top-0 left-0 w-screen h-screen
                sm:w-[500px] sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                flex flex-col custom-scrollbar
                pt-6
              "
            >
              <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-xl font-semibold">Progress</h2>
                <Button variant="ghost" size="icon" onClick={() => setProgressOpen(false)}>
                  ✕
                </Button>
              </div>
              <ScrollArea className="px-4 flex-1 custom-scrollbar">
                <ProgressCard />
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Question
            question={currentQ}
            feedback={state.feedback[currentQ.questionId]}
            selectedOption={state.selectedOptions[currentQ.questionId]}
            numericalAnswer={state.numericalAnswers[currentQ.questionId]}
            showMarkscheme={state.showMarkscheme[currentQ.questionId] || false}
            handleOptionClick={handleOptionClick}
            handleNumericalSubmit={handleNumericalSubmit}
            handleNumericalChange={(qId, val) => {
              dispatch({
                type: "SET_NUMERICAL_ANSWERS",
                payload: { ...state.numericalAnswers, [qId]: val },
              });
            }}
            handleMarkschemeToggle={(qId) => {
              dispatch({
                type: "SET_SHOW_MARKSCHEME",
                payload: {
                  ...state.showMarkscheme,
                  [qId]: !state.showMarkscheme[qId],
                },
              });
            }}
            handleMarkForReview={handleMarkForReview}
            handleMarkComplete={handleMarkComplete}
            handleResetQuestion={handleResetQuestion}
            isMarkedForReview={!!currentQ.reviewed}
            isMarkedComplete={!!currentQ.completed}
            markschemesDisabled={false}
            totalQuestions={total}
            currentQuestionIndex={mobileIndex}
            handleQuestionChange={() => {}}
          />
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              className="border-gray-300 font-medium text-gray-700 dark:border-gray-600 dark:text-gray-100"
              onClick={() => setMobileIndex(Math.max(0, mobileIndex - 1))}
              disabled={mobileIndex === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 font-medium text-gray-700 dark:border-gray-600 dark:text-gray-100"
              onClick={() => setMobileIndex(Math.min(total - 1, mobileIndex + 1))}
              disabled={mobileIndex === total - 1}
            >
              Next →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------- DESKTOP VIEW --------------
  if (!filteredQuestions.length) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 sm:p-8 text-gray-900 dark:text-gray-100">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE })}
          >
            Mobile View
          </Button>
          <p className="mt-6 text-red-300">No questions found with these filters.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE })}
            >
              Switch to Mobile View
            </Button>
          </div>

          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Question Bank</h1>

          {/* Search + mobile filters + navigator */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            </div>

            {/* Mobile filters button (hidden in desktop) */}
            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 sm:hidden flex items-center"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent
                className="
                  fixed top-0 left-0 w-screen h-screen
                  sm:w-[500px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  flex flex-col custom-scrollbar
                  pt-6
                "
              >
                <FiltersDialogMobile
                  open={filtersOpenMobile}
                  onOpenChange={setFiltersOpenMobile}
                  state={state}
                  dispatch={dispatch}
                />
              </DialogContent>
            </Dialog>

            {/* Desktop question navigator */}
            <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:hover:border-gray-500 dark:text-gray-100 hidden sm:flex"
                >
                  <List className="mr-2 h-4 w-4" />
                  Question Navigator
                </Button>
              </DialogTrigger>
              <DialogContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="sm:max-w-[80vw] sm:max-h-[80vh] dark:bg-gray-800 dark:text-gray-100 custom-scrollbar pt-6"
              >
                <ScrollArea className="h-[60vh] custom-scrollbar">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((q, index) => {
                      const absoluteIndex = (state.currentPage - 1) * state.pageSize + index;
                      const displayNum = absoluteIndex + 1;
                      return (
                        <Button
                          key={q.questionId}
                          variant={q.completed ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const el = document.getElementById(`question-${q.questionId}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className={`
                            w-10 h-10 dark:border-gray-700
                            ${
                              q.completed
                                ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300"
                                : q.reviewed
                                ? "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : ""
                            }
                          `}
                        >
                          {displayNum}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Progress Card */}
          <div className="mb-6">
            <ProgressCard />
          </div>

          {/* Status Filter Row */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all", "complete", "review", "incomplete"].map((st) => {
              const isActive = state.filters.status === st;
              return (
                <button
                  key={st}
                  onClick={() =>
                    dispatch({ type: "SET_FILTERS", payload: { ...state.filters, status: st } })
                  }
                  className={`
                    px-4 py-2 rounded-md transition-colors
                    ${
                      isActive
                        ? "border border-green-500 bg-green-50 text-green-700"
                        : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-gray-700 dark:hover:border-gray-500 text-gray-500 dark:text-gray-100"
                    }
                  `}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Desktop Filter Popovers */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {(
              [
                "exams",
                "subjects",
                "topics",
                "subtopics",
                "difficulties",
                "years",
                "types",
              ] as FilterKey[]
            ).map((filterType) => {
              const filterValues = state.filterOptions[filterType] || [];
              const isOpen = state.dropdowns[filterType];
              return (
                <Popover
                  key={filterType}
                  align="start"
                  openPopover={isOpen}
                  setOpenPopover={(open) => {
                    dispatch({ type: "SET_DROPDOWN", payload: { tag: filterType, value: !!open } });
                  }}
                  content={
                    <div className="p-2 w-full sm:w-80 bg-white dark:bg-gray-800 rounded-md custom-scrollbar max-h-60 overflow-auto">
                      <DesktopFilterSearch
                        filterType={filterType}
                        filterValues={filterValues}
                        state={state}
                        dispatch={dispatch}
                      />
                    </div>
                  }
                >
                  <button
                    onClick={() => {
                      dispatch({
                        type: "SET_DROPDOWN",
                        payload: { tag: filterType, value: !isOpen },
                      });
                    }}
                    className="
                      flex w-full sm:w-36 items-center justify-between
                      rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2
                      bg-white dark:bg-gray-800
                      transition-all duration-75
                      hover:border-gray-800 dark:hover:border-gray-500
                      focus:outline-none active:bg-gray-100 dark:active:bg-gray-700
                    "
                  >
                    <p className="text-gray-600 dark:text-gray-300">
                      {state.filters[filterType].length
                        ? `${state.filters[filterType].length} selected`
                        : filterType}
                    </p>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-all" />
                  </button>
                </Popover>
              );
            })}
          </div>

          {state.questions.length > 0 ? (
            <>
              {filteredQuestions.map((q, index) => {
                const absoluteIndex = (state.currentPage - 1) * state.pageSize + index;
                const displayNum = absoluteIndex + 1;

                return (
                  <Question
                    key={q.questionId}
                    question={q}
                    feedback={state.feedback[q.questionId]}
                    selectedOption={state.selectedOptions[q.questionId]}
                    numericalAnswer={state.numericalAnswers[q.questionId]}
                    showMarkscheme={state.showMarkscheme[q.questionId] || false}
                    handleOptionClick={handleOptionClick}
                    handleNumericalSubmit={handleNumericalSubmit}
                    handleNumericalChange={(qid, val) => {
                      dispatch({
                        type: "SET_NUMERICAL_ANSWERS",
                        payload: { ...state.numericalAnswers, [qid]: val },
                      });
                    }}
                    handleMarkschemeToggle={(qid) => {
                      dispatch({
                        type: "SET_SHOW_MARKSCHEME",
                        payload: {
                          ...state.showMarkscheme,
                          [qid]: !state.showMarkscheme[qid],
                        },
                      });
                    }}
                    handleMarkForReview={handleMarkForReview}
                    handleMarkComplete={handleMarkComplete}
                    handleResetQuestion={handleResetQuestion}
                    isMarkedForReview={!!q.reviewed}
                    isMarkedComplete={!!q.completed}
                    markschemesDisabled={false}
                    totalQuestions={state.totalCount}
                    currentQuestionIndex={displayNum - 1}
                    handleQuestionChange={() => {}}
                  />
                );
              })}
              <Pagination
                currentPage={state.currentPage}
                totalCount={state.totalCount}
                pageSize={state.pageSize}
                onPageChange={(p) => {
                  dispatch({ type: "SET_CURRENT_PAGE", payload: p });
                }}
              />
            </>
          ) : (
            <p className="text-red-400 dark:text-red-300">
              No questions found with these filters.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// -------------------- Desktop Filter Search Sub-component --------------------
function DesktopFilterSearch({
  filterType,
  filterValues,
  state,
  dispatch,
}: {
  filterType: FilterKey;
  filterValues: string[];
  state: StateType;
  dispatch: React.Dispatch<ActionType>;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // 1) Filter by searchTerm
  // 2) Sort so that selected items are at the top
  const displayedValues = useMemo(() => {
    let arr = filterValues;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      arr = arr.filter((val) => val.toLowerCase().includes(lower));
    }

    // sort selected items to top
    arr = arr.sort((a, b) => {
      const aSel = state.filters[filterType].includes(a);
      const bSel = state.filters[filterType].includes(b);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });

    return arr;
  }, [filterValues, searchTerm, state.filters, filterType]);

  const toggleItem = useCallback(
    (val: string) => {
      const isSelected = state.filters[filterType].includes(val);
      let newArr: string[];
      if (isSelected) {
        newArr = state.filters[filterType].filter((x) => x !== val);
      } else {
        newArr = [...state.filters[filterType], val];
      }
      dispatch({
        type: "SET_FILTERS",
        payload: { ...state.filters, [filterType]: newArr },
      });
    },
    [state.filters, dispatch, filterType]
  );

  return (
    <>
      <Input
        type="text"
        placeholder={`Search ${filterType.toLowerCase()}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2 dark:text-gray-100 dark:bg-gray-700 dark:placeholder-gray-400"
      />
      <motion.div className="flex flex-col gap-2" layout transition={transitionProps}>
        {displayedValues.map((val) => {
          const isSelected = state.filters[filterType].includes(val);
          return (
            <motion.button
              key={val}
              layout
              initial={false}
              onClick={() => toggleItem(val)}
              animate={{
                backgroundColor: isSelected ? "#E6F7FF" : "rgba(229, 231, 235, 0.5)",
              }}
              whileHover={{
                backgroundColor: isSelected ? "#CCEEFF" : "rgba(229, 231, 235, 0.8)",
              }}
              whileTap={{
                backgroundColor: isSelected ? "#B3E6FF" : "rgba(229, 231, 235, 0.9)",
              }}
              transition={{
                ...transitionProps,
                backgroundColor: { duration: 0.1 },
              }}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
                ${
                  isSelected
                    ? "text-blue-600 ring-blue-200"
                    : "text-gray-600 ring-gray-200"
                }
              `}
            >
              <motion.div
                className="relative flex items-center"
                animate={{
                  width: isSelected ? "auto" : "100%",
                  paddingRight: isSelected ? "1.25rem" : "0",
                }}
                transition={{
                  ease: [0.175, 0.885, 0.32, 1.275],
                  duration: 0.3,
                }}
              >
                <span>{transformFilterItem(val)}</span>
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={transitionProps}
                      className="absolute right-0"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={2} />
                      </div>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>
    </>
  );
}

// -------------------- Mobile Filters Dialog --------------------
function FiltersDialogMobile({
  open,
  onOpenChange,
  state,
  dispatch,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  state: StateType;
  dispatch: React.Dispatch<ActionType>;
}) {
  return (
    <FiltersDialog
      open={open}
      onOpenChange={onOpenChange}
      state={state}
      dispatch={dispatch}
    />
  );
}

// -------------------- Custom Filters Dialog (Mobile Implementation) --------------------
interface CustomFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: StateType;
  dispatch: React.Dispatch<ActionType>;
}

function FiltersDialog({ open, onOpenChange, state, dispatch }: CustomFiltersDialogProps) {
  const [searches, setSearches] = useState<Record<FilterKey, string>>({
    exams: "",
    subjects: "",
    topics: "",
    subtopics: "",
    difficulties: "",
    years: "",
    types: "",
  });

  const handleSearchChange = (category: FilterKey, value: string) => {
    setSearches((prev) => ({ ...prev, [category]: value }));
  };

  // same approach: filter & sort selected to top
  const filterAndSort = (items: string[], cat: FilterKey) => {
    let arr = items;
    const st = searches[cat]?.toLowerCase() || "";
    if (st) {
      arr = arr.filter((it) => it.toLowerCase().includes(st));
    }
    // selected to top
    arr = arr.sort((a, b) => {
      const aSel = state.filters[cat].includes(a);
      const bSel = state.filters[cat].includes(b);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
    return arr;
  };

  const toggleItem = (category: FilterKey, item: string) => {
    const oldArr = state.filters[category];
    const isSel = oldArr.includes(item);
    let newArr: string[];
    if (isSel) {
      newArr = oldArr.filter((i) => i !== item);
    } else {
      newArr = [...oldArr, item];
    }
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, [category]: newArr },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-full w-screen h-screen m-0 p-0 flex flex-col bg-white dark:bg-gray-900 custom-scrollbar"
        style={{ overflowY: "auto" }}
      >
        <div className="flex items-center justify-between sticky top-0 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Filters</h2>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 flex items-center gap-2 transition-all duration-200 ease-in-out"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out"
              onClick={() => onOpenChange(false)}
            >
              <span className="sr-only">Close</span>
              <Flag className="h-5 w-5 rotate-45" />
            </Button>
          </div>
        </div>
        <div className="flex-1 px-6 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Status row */}
            <div>
              <p className="text-xl font-medium mb-2 text-gray-800 dark:text-gray-100">Status</p>
              <div className="flex flex-wrap gap-2">
                {["all", "complete", "review", "incomplete"].map((st) => (
                  <Button
                    key={st}
                    variant={state.filters.status === st ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      dispatch({
                        type: "SET_FILTERS",
                        payload: { ...state.filters, status: st },
                      })
                    }
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Each filter category */}
            <MobileFilterSection
              title="exams"
              items={state.filterOptions.exams}
              searchValue={searches.exams}
              onSearchChange={(val) => handleSearchChange("exams", val)}
              displayedItems={filterAndSort(state.filterOptions.exams, "exams")}
              selectedItems={state.filters.exams}
              toggleItem={(item) => toggleItem("exams", item)}
            />
            <MobileFilterSection
              title="subjects"
              items={state.filterOptions.subjects}
              searchValue={searches.subjects}
              onSearchChange={(val) => handleSearchChange("subjects", val)}
              displayedItems={filterAndSort(state.filterOptions.subjects, "subjects")}
              selectedItems={state.filters.subjects}
              toggleItem={(item) => toggleItem("subjects", item)}
            />
            <MobileFilterSection
              title="topics"
              items={state.filterOptions.topics}
              searchValue={searches.topics}
              onSearchChange={(val) => handleSearchChange("topics", val)}
              displayedItems={filterAndSort(state.filterOptions.topics, "topics")}
              selectedItems={state.filters.topics}
              toggleItem={(item) => toggleItem("topics", item)}
            />
            <MobileFilterSection
              title="subtopics"
              items={state.filterOptions.subtopics}
              searchValue={searches.subtopics}
              onSearchChange={(val) => handleSearchChange("subtopics", val)}
              displayedItems={filterAndSort(state.filterOptions.subtopics, "subtopics")}
              selectedItems={state.filters.subtopics}
              toggleItem={(item) => toggleItem("subtopics", item)}
            />
            <MobileFilterSection
              title="difficulties"
              items={state.filterOptions.difficulties}
              searchValue={searches.difficulties}
              onSearchChange={(val) => handleSearchChange("difficulties", val)}
              displayedItems={filterAndSort(state.filterOptions.difficulties, "difficulties")}
              selectedItems={state.filters.difficulties}
              toggleItem={(item) => toggleItem("difficulties", item)}
            />
            <MobileFilterSection
              title="years"
              items={state.filterOptions.years}
              searchValue={searches.years}
              onSearchChange={(val) => handleSearchChange("years", val)}
              displayedItems={filterAndSort(state.filterOptions.years, "years")}
              selectedItems={state.filters.years}
              toggleItem={(item) => toggleItem("years", item)}
            />
            <MobileFilterSection
              title="types"
              items={state.filterOptions.types}
              searchValue={searches.types}
              onSearchChange={(val) => handleSearchChange("types", val)}
              displayedItems={filterAndSort(state.filterOptions.types, "types")}
              selectedItems={state.filters.types}
              toggleItem={(item) => toggleItem("types", item)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// -------------------- Mobile Filter Section --------------------
interface MobileFilterSectionProps {
  title: string;
  items: string[];
  displayedItems: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedItems: string[];
  toggleItem: (item: string) => void;
}

function MobileFilterSection({
  title,
  displayedItems,
  searchValue,
  onSearchChange,
  selectedItems,
  toggleItem,
}: MobileFilterSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100">{title}</h3>
      <div className="relative">
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 pl-10 py-2 text-gray-800 dark:text-gray-100"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      <div className="flex flex-col gap-2">
        {displayedItems.map((item) => {
          const isSelected = selectedItems.includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleItem(item)}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
                transition-all duration-200 ease-in-out
                ${
                  isSelected
                    ? "bg-blue-50 text-blue-600 ring-blue-200 hover:bg-blue-100"
                    : "bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:ring-gray-700 dark:text-gray-200"
                }
              `}
            >
              <span className="mr-1.5">{transformFilterItem(item)}</span>
              {isSelected && (
                <span className="flex-shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
