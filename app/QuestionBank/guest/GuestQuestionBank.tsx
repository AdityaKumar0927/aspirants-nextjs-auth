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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

import Popover from "@/components/shared/popover";
import Question from "@/components/shared/Question";

/* ------------------------------------------------------------------
   1) Enums & Types
   ------------------------------------------------------------------ */
enum ViewMode {
  DESKTOP = "desktop",
  MOBILE = "mobile",
}

type QuestionTypeString = "Multiple Choice" | "Numerical" | string;

interface QuestionType {
  id: number;
  questionId: string;
  text: string;
  exam?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  year?: number;
  type?: QuestionTypeString;
  options?: string[];
  correctOption?: string;
}

interface FilterOptionsType {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  years: string[];
  types: string[];
}

type FilterKey =
  | "exams"
  | "subjects"
  | "topics"
  | "subtopics"
  | "difficulties"
  | "years"
  | "types";

interface FiltersType {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  years: string[];
  types: string[];
  status: "all" | "complete" | "review" | "incomplete";
}

type DropdownsType = {
  [K in FilterKey]: boolean;
};

interface StateType {
  loading: boolean;
  actionLoading: boolean;
  viewMode: ViewMode;

  // The paginated subset from /api/questions
  questions: QuestionType[];

  // Distinct filter sets from /api/filters
  filterOptions: FilterOptionsType;

  // The user’s chosen filters
  filters: FiltersType;

  // Popover open states
  dropdowns: DropdownsType;

  // Search text
  searchQuery: string;

  // Local progress
  feedback: Record<string, string | undefined>;        // questionId => "correct"/"incorrect"
  selectedOptions: Record<string, string | undefined>; // questionId => chosen MCQ letter
  reviewed: Record<string, boolean>;                   // questionId => flagged
  completed: Record<string, boolean>;                  // questionId => done
  showMarkscheme: Record<string, boolean>;             // questionId => show/hide

  // Pagination
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

// Action
type ActionType =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTION_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_QUESTIONS"; payload: QuestionType[] }
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptionsType }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_DROPDOWNS"; payload: { key: FilterKey; value: boolean } }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FEEDBACK"; payload: Record<string, string | undefined> }
  | { type: "SET_SELECTED_OPTIONS"; payload: Record<string, string | undefined> }
  | { type: "SET_REVIEWED"; payload: Record<string, boolean> }
  | { type: "SET_COMPLETED"; payload: Record<string, boolean> }
  | { type: "SET_SHOW_MARKSCHEME"; payload: Record<string, boolean> }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_TOTAL_COUNT"; payload: number };

/* ------------------------------------------------------------------
   2) Helpers
   ------------------------------------------------------------------ */
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function transformFilterItem(value: string): string {
  // Replace hyphens with spaces, then Title-Case
  const replaced = value.replace(/-/g, " ");
  return replaced
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const transitionProps = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

/* ------------------------------------------------------------------
   3) Reducer
   ------------------------------------------------------------------ */
function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_FILTER_OPTIONS":
      return { ...state, filterOptions: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "SET_DROPDOWNS":
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          [action.payload.key]: action.payload.value,
        },
      };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload };
    case "SET_SELECTED_OPTIONS":
      return { ...state, selectedOptions: action.payload };
    case "SET_REVIEWED":
      return { ...state, reviewed: action.payload };
    case "SET_COMPLETED":
      return { ...state, completed: action.payload };
    case "SET_SHOW_MARKSCHEME":
      return { ...state, showMarkscheme: action.payload };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_TOTAL_COUNT":
      return { ...state, totalCount: action.payload };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------
   4) Initial State
   ------------------------------------------------------------------ */
const initialState: StateType = {
  loading: true,
  actionLoading: false,
  viewMode: ViewMode.DESKTOP,
  questions: [],
  filterOptions: {
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    years: [],
    types: [],
  },
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
  dropdowns: {
    exams: false,
    subjects: false,
    topics: false,
    subtopics: false,
    difficulties: false,
    years: false,
    types: false,
  },
  searchQuery: "",
  feedback: {},
  selectedOptions: {},
  reviewed: {},
  completed: {},
  showMarkscheme: {},
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
};

/* ------------------------------------------------------------------
   5) Pagination Component
   ------------------------------------------------------------------ */
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
    <nav className="flex items-center justify-center mt-6">
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

/* ------------------------------------------------------------------
   6) Main GuestQuestionBank
   ------------------------------------------------------------------ */
export default function GuestQuestionBank() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  // For mobile single-question navigation
  const [mobileIndex, setMobileIndex] = useState(0);
  // For filter & navigator modals
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  // Decide initial view mode
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE });
    }
  }, []);

  /* -------------------------------
     (A) Fetch distinct filter fields
     ------------------------------- */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/filters", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch filter fields.");
      const data: FilterOptionsType = await res.json();
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data });
    } catch (err) {
      console.error("Error fetching filter options:", err);
      toast({
        title: "Error",
        description: "Unable to load filter fields.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  /* -------------------------------
     (B) Fetch questions
     ------------------------------- */
  const fetchQuestions = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { currentPage, pageSize, filters } = state;
      const { exams, subjects, topics, subtopics, difficulties, years, types } = filters;

      function arrToComma(arr: string[]) {
        return arr.join(",");
      }
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
        throw new Error("Failed to fetch questions. " + txt);
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

      // Sort ascending by numeric portion of questionId
      data = data.sort((a, b) => {
        const aId = a.questionId?.match(/\d+/)?.[0] || "0";
        const bId = b.questionId?.match(/\d+/)?.[0] || "0";
        return parseInt(aId, 10) - parseInt(bId, 10);
      });

      // Ensure each question has an `id` field for local indexing
      data = data.map((q, i) => ({ ...q, id: i + 1 }));

      dispatch({ type: "SET_QUESTIONS", payload: data });
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount });
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast({
        title: "Error",
        description: "Could not load questions. Please try again later.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.currentPage, state.pageSize, state.filters, toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  /* -------------------------------
     (C) Filtered local questions
     ------------------------------- */
  const filteredQuestions = useMemo(() => {
    const s = state.searchQuery.toLowerCase();
    return state.questions.filter((q) => {
      const textFields = [q.text, q.exam, q.subject, q.topic, q.subtopic, q.type];
      const matchesSearch = textFields.some((f) => f && fuzzyContains(f, s));

      const qid = q.questionId;
      let matchesStatus = true;
      if (state.filters.status === "complete") {
        if (!state.completed[qid]) matchesStatus = false;
      } else if (state.filters.status === "review") {
        if (!state.reviewed[qid]) matchesStatus = false;
      } else if (state.filters.status === "incomplete") {
        if (state.completed[qid]) matchesStatus = false;
      }
      return matchesSearch && matchesStatus;
    });
  }, [state.questions, state.completed, state.reviewed, state.filters.status, state.searchQuery]);

  /* -------------------------------
     (D) Local progress stats
     ------------------------------- */
  const localStats = useMemo(() => {
    const totalDB = state.totalCount;
    // answered => union of "completed" or feedback==="correct"
    const answeredSet = new Set<string>();
    Object.entries(state.completed).forEach(([qid, val]) => {
      if (val) answeredSet.add(qid);
    });
    Object.entries(state.feedback).forEach(([qid, fb]) => {
      if (fb === "correct") answeredSet.add(qid);
    });
    const answered = answeredSet.size;

    // flagged => reviewed
    const reviewSet = new Set<string>();
    Object.entries(state.reviewed).forEach(([qid, val]) => {
      if (val) reviewSet.add(qid);
    });
    const forReview = reviewSet.size;

    const progressPct = totalDB > 0 ? (answered / totalDB) * 100 : 0;
    return { total: totalDB, answered, forReview, progress: progressPct };
  }, [state.totalCount, state.completed, state.feedback, state.reviewed]);

  // Pagination
  const totalPages = Math.ceil(state.totalCount / state.pageSize);
  const handlePageChange = (newPage: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: newPage });
  };

  /* -------------------------------
     (E) Loading Skeleton
     ------------------------------- */
  if (state.loading || state.actionLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full text-gray-900 dark:text-gray-100">
          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Guest Question Bank</h1>
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

  /* ------------------------------------------------------------------
     7) MOBILE VIEW
     ------------------------------------------------------------------ */
  if (state.viewMode === ViewMode.MOBILE) {
    if (!filteredQuestions.length) {
      return (
        <div className="bg-white dark:bg-gray-900 w-full min-h-screen p-4 text-gray-900 dark:text-gray-100">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.DESKTOP })}
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
          {/* Top bar */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.DESKTOP })}
            >
              Desktop View
            </Button>

            <div className="flex items-center gap-2">
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Filter className="w-4 h-4 mr-1" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="
                    fixed top-0 left-0 w-screen h-screen
                    sm:w-[500px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    flex flex-col
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

          {/* The single question for mobile */}
          <Question
            question={currentQ}
            feedback={state.feedback[currentQ.questionId]}
            selectedOption={state.selectedOptions[currentQ.questionId]}
            numericalAnswer={"" /* Not used in this example */}
            showMarkscheme={state.showMarkscheme[currentQ.questionId] || false}
            handleOptionClick={(questionId, option, correctOption) => {
              const isCorrect = option === correctOption;
              dispatch({
                type: "SET_FEEDBACK",
                payload: { ...state.feedback, [questionId]: isCorrect ? "correct" : "incorrect" },
              });
              dispatch({
                type: "SET_SELECTED_OPTIONS",
                payload: { ...state.selectedOptions, [questionId]: option },
              });
              dispatch({
                type: "SET_COMPLETED",
                payload: { ...state.completed, [questionId]: true },
              });
            }}
            handleNumericalSubmit={() => {}}
            handleNumericalChange={() => {}}
            handleMarkschemeToggle={(qId) => {
              dispatch({
                type: "SET_SHOW_MARKSCHEME",
                payload: { ...state.showMarkscheme, [qId]: !state.showMarkscheme[qId] },
              });
            }}
            handleMarkForReview={(qId) => {
              dispatch({
                type: "SET_REVIEWED",
                payload: { ...state.reviewed, [qId]: !state.reviewed[qId] },
              });
            }}
            handleMarkComplete={(qId) => {
              dispatch({
                type: "SET_COMPLETED",
                payload: { ...state.completed, [qId]: !state.completed[qId] },
              });
            }}
            handleResetQuestion={(qId) => {
              const fbCopy = { ...state.feedback };
              delete fbCopy[qId];
              const selCopy = { ...state.selectedOptions };
              delete selCopy[qId];
              dispatch({ type: "SET_FEEDBACK", payload: fbCopy });
              dispatch({ type: "SET_SELECTED_OPTIONS", payload: selCopy });
              dispatch({
                type: "SET_REVIEWED",
                payload: { ...state.reviewed, [qId]: false },
              });
              dispatch({
                type: "SET_COMPLETED",
                payload: { ...state.completed, [qId]: false },
              });
            }}
            isMarkedForReview={!!state.reviewed[currentQ.questionId]}
            isMarkedComplete={!!state.completed[currentQ.questionId]}
            markschemesDisabled={false}
            totalQuestions={total}
            currentQuestionIndex={mobileIndex}
            handleQuestionChange={() => {}}
          />

          {/* Next/Prev on mobile */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setMobileIndex(Math.max(0, mobileIndex - 1))}
              disabled={mobileIndex === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
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

  /* ------------------------------------------------------------------
     8) DESKTOP VIEW
     ------------------------------------------------------------------ */
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
          {/* Switch to Mobile */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE })}
            >
              Switch to Mobile View
            </Button>
          </div>

          <h1 className="mb-2 text-left text-3xl sm:text-4xl">Guest Question Bank</h1>

          {/* Search + mobile-filters + navigator */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions..."
                value={state.searchQuery}
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })
                }
                className="pl-10 dark:text-gray-100 dark:bg-gray-800 dark:placeholder-gray-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            </div>

            {/* Mobile filters button (hidden on desktop) */}
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
                  flex flex-col
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
                <Button variant="outline" className="dark:border-gray-700 dark:text-gray-100 hidden sm:flex">
                  <List className="mr-2 h-4 w-4" />
                  Question Navigator
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-[80vw] sm:max-h-[80vh] dark:bg-gray-800 dark:text-gray-100"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4">
                    {filteredQuestions.map((q, index) => {
                      const displayNum = (state.currentPage - 1) * state.pageSize + index + 1;
                      const qid = q.questionId;
                      return (
                        <Button
                          key={qid}
                          variant={state.completed[qid] ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const el = document.getElementById(`question-${qid}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className={`
                            w-10 h-10 dark:border-gray-700
                            ${
                              state.completed[qid]
                                ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300"
                                : state.reviewed[qid]
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

          {/* Status Filter Row (desktop) */}
          <div className="hidden sm:flex space-x-4 mb-2">
            {["all", "complete", "review", "incomplete"].map((st) => {
              const isActive = state.filters.status === st;
              return (
                <button
                  key={st}
                  onClick={() =>
                    dispatch({
                      type: "SET_FILTERS",
                      payload: { ...state.filters, status: st as FiltersType["status"] },
                    })
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
            ).map((filterKey) => {
              const distinctVals = state.filterOptions[filterKey] || [];
              const open = state.dropdowns[filterKey];
              return (
                <Popover
                  key={filterKey}
                  align="start"
                  openPopover={open}
                  setOpenPopover={(val) =>
                    dispatch({ type: "SET_DROPDOWNS", payload: { key: filterKey, value: !!val } })
                  }
                  content={
                    <div className="p-2 w-full sm:w-80 bg-white dark:bg-gray-800 rounded-md">
                      <DesktopFilterSearch
                        filterType={filterKey}
                        filterValues={distinctVals}
                        state={state}
                        dispatch={dispatch}
                      />
                    </div>
                  }
                >
                  <button
                    onClick={() => {
                      dispatch({
                        type: "SET_DROPDOWNS",
                        payload: { key: filterKey, value: !open },
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
                      {state.filters[filterKey].length
                        ? `${state.filters[filterKey].length} selected`
                        : filterKey}
                    </p>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </Popover>
              );
            })}
          </div>

          {/* Progress Card (like QuestionBankContent) */}
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
                    {localStats.total > 0 ? Math.round(localStats.progress) : 0}%
                  </span>
                </div>
                <Progress
                  value={localStats.progress}
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
                        {localStats.total}
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
                        {localStats.answered}
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
                        {localStats.forReview}
                      </p>
                      <p className="text-sm font-light tracking-tight text-gray-500 dark:text-gray-400">
                        For Review
                      </p>
                    </div>
                  </div>
                  {/* you could add a "not answered" block if desired */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop question list */}
          {filteredQuestions.length > 0 ? (
            <>
              {filteredQuestions.map((q, idx) => {
                const displayNum = (state.currentPage - 1) * state.pageSize + idx + 1;
                const qid = q.questionId;
                return (
                  <Question
                    key={qid}
                    question={q}
                    feedback={state.feedback[qid]}
                    selectedOption={state.selectedOptions[qid]}
                    numericalAnswer={""}
                    showMarkscheme={state.showMarkscheme[qid] || false}
                    handleOptionClick={(questionId, option, correctOption) => {
                      const isCorrect = option === correctOption;
                      dispatch({
                        type: "SET_FEEDBACK",
                        payload: {
                          ...state.feedback,
                          [questionId]: isCorrect ? "correct" : "incorrect",
                        },
                      });
                      dispatch({
                        type: "SET_SELECTED_OPTIONS",
                        payload: { ...state.selectedOptions, [questionId]: option },
                      });
                      dispatch({
                        type: "SET_COMPLETED",
                        payload: { ...state.completed, [questionId]: true },
                      });
                    }}
                    handleNumericalSubmit={() => {}}
                    handleNumericalChange={() => {}}
                    handleMarkschemeToggle={(questionId) => {
                      const cp = { ...state.showMarkscheme };
                      cp[questionId] = !cp[questionId];
                      dispatch({ type: "SET_SHOW_MARKSCHEME", payload: cp });
                    }}
                    handleMarkForReview={(questionId) => {
                      const rev = { ...state.reviewed };
                      rev[questionId] = !rev[questionId];
                      dispatch({ type: "SET_REVIEWED", payload: rev });
                    }}
                    handleMarkComplete={(questionId) => {
                      const cmp = { ...state.completed };
                      cmp[questionId] = !cmp[questionId];
                      dispatch({ type: "SET_COMPLETED", payload: cmp });
                    }}
                    handleResetQuestion={(questionId) => {
                      const fbCopy = { ...state.feedback };
                      delete fbCopy[questionId];
                      const selCopy = { ...state.selectedOptions };
                      delete selCopy[questionId];
                      dispatch({ type: "SET_FEEDBACK", payload: fbCopy });
                      dispatch({ type: "SET_SELECTED_OPTIONS", payload: selCopy });
                      dispatch({
                        type: "SET_REVIEWED",
                        payload: { ...state.reviewed, [questionId]: false },
                      });
                      dispatch({
                        type: "SET_COMPLETED",
                        payload: { ...state.completed, [questionId]: false },
                      });
                    }}
                    isMarkedForReview={!!state.reviewed[qid]}
                    isMarkedComplete={!!state.completed[qid]}
                    markschemesDisabled={false}
                    totalQuestions={state.totalCount}
                    currentQuestionIndex={displayNum - 1}
                    handleQuestionChange={() => {}}
                  />
                );
              })}

              {/* Pagination */}
              <Pagination
                currentPage={state.currentPage}
                totalCount={state.totalCount}
                pageSize={state.pageSize}
                onPageChange={handlePageChange}
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

/* ------------------------------------------------------------------
   9) Desktop Filter Search Subcomponent
   ------------------------------------------------------------------ */
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

  const displayedValues = useMemo(() => {
    if (!searchTerm) return filterValues;
    const lower = searchTerm.toLowerCase();
    return filterValues.filter((val) => val.toLowerCase().includes(lower));
  }, [filterValues, searchTerm]);

  const toggleItem = useCallback(
    (val: string) => {
      const arr = state.filters[filterType];
      const isSelected = arr.includes(val);
      let newArr: string[];
      if (isSelected) {
        newArr = arr.filter((x) => x !== val);
      } else {
        newArr = [...arr, val];
      }
      dispatch({
        type: "SET_FILTERS",
        payload: { ...state.filters, [filterType]: newArr },
      });
    },
    [state.filters, filterType, dispatch]
  );

  return (
    <>
      <Input
        type="text"
        placeholder={`Search ${filterType}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2 dark:text-gray-100 dark:bg-gray-700 dark:placeholder-gray-400"
      />
      <ScrollArea className="max-h-60">
        <motion.div className="flex flex-col gap-2" layout transition={transitionProps}>
          {displayedValues.map((val) => {
            const isSelected = state.filters[filterType].includes(val);
            return (
              <motion.button
                key={val}
                layout
                initial={false}
                animate={{
                  backgroundColor: isSelected ? "#E6F7FF" : "rgba(229, 231, 235, 0.5)",
                }}
                whileHover={{
                  backgroundColor: isSelected ? "#CCEEFF" : "rgba(229, 231, 235, 0.8)",
                }}
                whileTap={{
                  backgroundColor: isSelected ? "#B3E6FF" : "rgba(229, 231, 235, 0.9)",
                }}
                transition={{ ...transitionProps, backgroundColor: { duration: 0.1 } }}
                onClick={() => toggleItem(val)}
                className={`
                  inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                  whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
                  ${
                    isSelected ? "text-blue-600 ring-blue-200" : "text-gray-600 ring-gray-200"
                  }
                `}
              >
                <motion.div
                  className="relative flex items-center"
                  animate={{
                    width: isSelected ? "auto" : "100%",
                    paddingRight: isSelected ? "1.25rem" : "0",
                  }}
                  transition={{ ease: [0.175, 0.885, 0.32, 1.275], duration: 0.3 }}
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
      </ScrollArea>
    </>
  );
}

/* ------------------------------------------------------------------
   10) Mobile Filters Dialog
   ------------------------------------------------------------------ */
interface CustomFiltersDialogProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  state: StateType;
  dispatch: React.Dispatch<ActionType>;
}

function FiltersDialogMobile({ open, onOpenChange, state, dispatch }: CustomFiltersDialogProps) {
  return (
    <FiltersDialog open={open} onOpenChange={onOpenChange} state={state} dispatch={dispatch} />
  );
}

/* ------------------------------------------------------------------
   11) Actual Filters Dialog Content (for Mobile)
   ------------------------------------------------------------------ */
function FiltersDialog({ open, onOpenChange, state, dispatch }: CustomFiltersDialogProps) {
  const [search, setSearch] = useState<Record<string, string>>({
    exams: "",
    subjects: "",
    topics: "",
    subtopics: "",
    difficulties: "",
    years: "",
    types: "",
  });

  const filterKeys: FilterKey[] = [
    "exams",
    "subjects",
    "topics",
    "subtopics",
    "difficulties",
    "years",
    "types",
  ];

  const handleSearchChange = (category: string, val: string) => {
    setSearch((prev) => ({ ...prev, [category]: val }));
  };

  const toggleItem = (fk: FilterKey, val: string) => {
    const arr = state.filters[fk];
    const isSelected = arr.includes(val);
    let newArr;
    if (isSelected) {
      newArr = arr.filter((x) => x !== val);
    } else {
      newArr = [...arr, val];
    }
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, [fk]: newArr },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-screen h-screen m-0 p-0 flex flex-col bg-white dark:bg-gray-900">
        {/* Top bar */}
        <div className="flex items-center justify-between sticky top-0 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Filters</h2>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 flex items-center gap-2 transition-all duration-200 ease-in-out"
              onClick={() => onOpenChange(false)}
            >
              <Check className="w-4 h-4" />
              Apply
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

        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Status row */}
            <div>
              <p className="font-semibold mb-2">Question Status</p>
              <div className="flex flex-wrap gap-2">
                {["all", "complete", "review", "incomplete"].map((st) => (
                  <Button
                    key={st}
                    variant={state.filters.status === st ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      dispatch({ type: "SET_FILTERS", payload: { ...state.filters, status: st as any } })
                    }
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter categories */}
            {filterKeys.map((fk) => {
              const distinctVals = state.filterOptions[fk] || [];
              const term = search[fk] || "";
              const displayed = !term
                ? distinctVals
                : distinctVals.filter((val) => val.toLowerCase().includes(term.toLowerCase()));
              return (
                <div key={fk}>
                  <p className="font-semibold mb-2 capitalize">{fk}</p>
                  <Input
                    value={term}
                    onChange={(e) => handleSearchChange(fk, e.target.value)}
                    placeholder={`Search ${fk}...`}
                    className="mb-2 dark:text-gray-100 dark:bg-gray-700 dark:placeholder-gray-400"
                  />
                  <div className="border p-2 rounded-md max-h-40 overflow-y-auto">
                    {displayed.map((val) => {
                      const isSel = state.filters[fk].includes(val);
                      return (
                        <label
                          key={val}
                          className="flex items-center space-x-2 px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox w-4 h-4 text-blue-600 dark:text-blue-400"
                            checked={isSel}
                            onChange={() => toggleItem(fk, val)}
                          />
                          <span>{transformFilterItem(val)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
