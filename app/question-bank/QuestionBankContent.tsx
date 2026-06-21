"use client";

import React, { useReducer, useEffect, useCallback, useMemo, useState, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { ToastAction } from "@/components/ui/toast";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  HelpCircle,
  Flag,
  LayoutGrid,
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
import Question from "@/components/question-bank/Question";
import { DialogClose } from "@/components/ui/dialog";
import { gradeAnswer, normalizeQuestion } from "@/lib/exam-helpers";
import type { StructuredMarkscheme } from "@/lib/userbank/schema";

/* ------------------------------------------------------------------
   1) Enums & Types
   ------------------------------------------------------------------ */
enum ViewMode {
  DESKTOP = "desktop",
  MOBILE = "mobile",
}

type QuestionTypeString = "Multiple Choice" | "Numerical" | string;

export interface QuestionType {
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
  // Answer-key fields read at runtime by normalizeQuestion()/gradeAnswer().
  // Global questions carry these too (the API returns them); declaring them
  // optional lets an injected source supply them without excess-property errors.
  correctOptions?: string[];
  answerText?: string | null;
  answerMin?: number | null;
  answerMax?: number | null;
  markscheme?: string;
  // We keep `explanation` as the DB field for markschemes
  explanation?: string;
  // Custom-bank learning-science fields (undefined for global questions).
  hints?: string[];
  markschemeData?: StructuredMarkscheme | null;
  notes?: string;
  diagramUrl?: string;
  exam?: string;
  customTags?: string[];  // <--- We also filter by these
  difficultyRating?: number;
}

type FilterKey =
  | "exams"
  | "subjects"
  | "topics"
  | "subtopics"
  | "difficulties"
  | "years"
  | "types"
  | "customTags"; // <--- NEW filter key for custom tags

type FiltersType = {
  [K in FilterKey]: string[];
} & {
  status: string; // "all" | "complete" | "review" | "incomplete"
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
  customTags: string[]; // <--- We'll populate these from /api/filters if available
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

/* ------------------------------------------------------------------
   2) Action
   ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------
   3) Helpers
   ------------------------------------------------------------------ */
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

const transitionProps: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

/* ------------------------------------------------------------------
   4) Initial State
   ------------------------------------------------------------------ */
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
    customTags: [], // <--- new
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
    customTags: [], // <--- new
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
    customTags: false, // <--- new
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

/* ------------------------------------------------------------------
   5) Reducer
   ------------------------------------------------------------------ */
function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload };
    case "SET_FILTERS":
      // Reset to page 1 on any filter change, else a narrower filter can leave
      // currentPage out of range and show a spurious "no questions found".
      return { ...state, filters: action.payload, currentPage: 1 };
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

/* ------------------------------------------------------------------
   6) Pagination
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

/* ------------------------------------------------------------------
   7) Main Component: QuestionBankContent

   Reusable across the global Question Bank and a private "my-bank": data,
   persistence and a handful of global-only features are injected. EVERY prop
   defaults to the global behavior, so the live Question Bank (which renders
   <QuestionBankContent /> with no props) is unchanged.
   ------------------------------------------------------------------ */
export interface QuestionSource {
  loadQuestions: (
    filters: FiltersType,
    page: number,
    pageSize: number
  ) =>
    | Promise<{ data: QuestionType[]; totalCount: number }>
    | { data: QuestionType[]; totalCount: number };
  loadFilterOptions: () => Promise<FilterOptionsType> | FilterOptionsType;
  loadStats: (filters: FiltersType) => Promise<GlobalStats> | GlobalStats;
}

export interface QuestionPersistence {
  saveProgress: (body: {
    questionId: string;
    completed?: boolean;
    reviewed?: boolean;
  }) => Promise<boolean>;
  recordAnswer?: (questionId: string, answer: string) => void;
}

export interface QuestionBankFeatures {
  examYearFilters: boolean; // exam/year/subtopic facets
  customTags: boolean;
  community: boolean; // report-issue + discussion on the card
  difficultyRating: boolean;
  pagination: boolean;
  signInGate: boolean;
  meritRecording: boolean;
  // Learning-science mode for custom banks: progressive hints + a markscheme
  // reveal gated behind a confirm + structured (concept/approach/solution) display.
  learningMode: boolean;
}

const DEFAULT_FEATURES: QuestionBankFeatures = {
  examYearFilters: true,
  customTags: true,
  community: true,
  difficultyRating: true,
  pagination: true,
  signInGate: true,
  meritRecording: true,
  learningMode: false,
};

const ALL_FACETS: FilterKey[] = [
  "exams",
  "subjects",
  "topics",
  "subtopics",
  "difficulties",
  "years",
  "types",
  "customTags",
];

interface QuestionBankContentProps {
  /** Inject a non-global data source (e.g. a private bank). Default = /api/* fetches. */
  source?: QuestionSource;
  /** Inject persistence. Default = /api/questions PATCH + /api/user-answers. */
  persistence?: QuestionPersistence;
  /** Toggle global-only features off (banks). Default = all on. */
  features?: Partial<QuestionBankFeatures>;
  title?: string;
  eyebrow?: string;
}

export default function QuestionBankContent(props: QuestionBankContentProps = {}) {
  const { source, persistence } = props;
  const features = useMemo<QuestionBankFeatures>(
    () => ({ ...DEFAULT_FEATURES, ...props.features }),
    [props.features]
  );
  const visibleFacets = useMemo<FilterKey[]>(
    () =>
      ALL_FACETS.filter((f) => {
        if ((f === "exams" || f === "years" || f === "subtopics") && !features.examYearFilters)
          return false;
        if (f === "customTags" && !features.customTags) return false;
        return true;
      }),
    [features.examYearFilters, features.customTags]
  );
  const headerTitle = props.title ?? "Question Bank";
  const headerEyebrow = props.eyebrow ?? "Previous year questions";

  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const { status } = useSession();
  const fetchSeqRef = useRef(0);

  // Guests can browse and answer freely, but persisting progress needs a session.
  // Prompt them to sign in rather than letting the PATCH fail silently with a 401
  // (which previously left the UI looking saved while nothing was written).
  const notifySignInToSave = useCallback(() => {
    toast({
      variant: "info",
      title: "Sign in to save your progress",
      description:
        "Browse and answer all you like — sign in to keep your completed and flagged questions across sessions.",
      action: (
        <ToastAction altText="Sign in" onClick={() => signIn()}>
          Sign in
        </ToastAction>
      ),
    });
  }, [toast]);

  const persistProgress = useCallback(
    async (body: { questionId: string; completed?: boolean; reviewed?: boolean }): Promise<boolean> => {
      // Injected persistence (e.g. a private bank) takes over entirely.
      if (persistence) return persistence.saveProgress(body);
      if (status === "unauthenticated") {
        notifySignInToSave();
        return false;
      }
      const res = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        notifySignInToSave();
        return false;
      }
      if (!res.ok) throw new Error(`Failed to save progress (${res.status})`);
      return true;
    },
    [status, notifySignInToSave, persistence]
  );

  // Record the actual answer so practice here counts on the Merit List + stats.
  // The server re-grades (we never trust client correctness); guests are skipped
  // (persistProgress already prompts them to sign in). Fire-and-forget.
  const recordAnswer = useCallback(
    (questionId: string, selectedOption: string) => {
      if (!features.meritRecording) return; // banks don't feed the global Merit List
      if (persistence?.recordAnswer) {
        persistence.recordAnswer(questionId, selectedOption);
        return;
      }
      if (status !== "authenticated" || !selectedOption) return;
      fetch("/api/user-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOption }),
      }).catch(() => {});
    },
    [status, features.meritRecording, persistence]
  );

  // For mobile single-question navigation
  const [mobileIndex, setMobileIndex] = useState(0);

  // For mobile filters & navigator modals
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  // For mobile "View Progress"
  const [progressOpen, setProgressOpen] = useState(false);

  // Decide initial view mode (mobile vs. desktop)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE });
    }
  }, []);

  /* ------------------------------
     (A) Fetch filter options
     ------------------------------ */
  const fetchFilterOptions = useCallback(async () => {
    try {
      let data: FilterOptionsType;
      if (source) {
        data = await source.loadFilterOptions();
      } else {
        const res = await fetch("/api/filters", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch distinct filter fields.");
        const raw = await res.json();
        // We now expect `raw.customTags` for custom tag suggestions if you have them
        data = {
          exams: raw.exams ?? [],
          subjects: raw.subjects ?? [],
          topics: raw.topics ?? [],
          subtopics: raw.subtopics ?? [],
          difficulties: raw.difficulties ?? [],
          years: raw.years ?? [],
          types: raw.types ?? [],
          customTags: raw.customTags ?? [], // <--- new
        };
      }
      dispatch({ type: "SET_FILTER_OPTIONS", payload: data });
    } catch (err) {
      console.error("Error fetching filter options:", err);
      // *** Improved toast styling for error
      toast({
        title: "Error",
        description: "Could not load filter fields. Try again later.",
        variant: "destructive", // triggers a red-themed toast
      });
    }
  }, [toast, source]);

  /* ------------------------------
     (B) Fetch global stats
     ------------------------------ */
  const fetchGlobalStats = useCallback(async () => {
    try {
      let stats: GlobalStats;
      if (source) {
        stats = await source.loadStats(state.filters);
      } else {
        const { exams, subjects, topics, subtopics, difficulties, years, types, customTags } =
          state.filters;
        const arrToComma = (arr: string[]) => arr.join(",");
        const params = new URLSearchParams();
        if (exams.length) params.set("exam", arrToComma(exams));
        if (subjects.length) params.set("subject", arrToComma(subjects));
        if (topics.length) params.set("topic", arrToComma(topics));
        if (subtopics.length) params.set("subtopic", arrToComma(subtopics));
        if (difficulties.length) params.set("difficulty", arrToComma(difficulties));
        if (years.length) params.set("year", arrToComma(years));
        if (types.length) params.set("type", arrToComma(types));

        // NEW: customTags
        if (customTags.length) {
          params.set("customTags", arrToComma(customTags));
        }

        const statsUrl = `/api/questions/stats?${params.toString()}`;
        const resp = await fetch(statsUrl, { cache: "no-store" });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Failed to fetch stats: ${txt}`);
        }
        const raw = await resp.json();
        stats = {
          total: raw.total || raw.totalQuestions || 0,
          completed: raw.completed || 0,
          reviewed: raw.reviewed || 0,
          notAnswered: raw.notAnswered || 0,
        };
      }
      dispatch({ type: "SET_GLOBAL_STATS", payload: stats });
    } catch (err) {
      console.error("Error fetching global stats:", err);
      // We won't toast every stats error, but you could.
    }
  }, [state.filters, source]);

  /* ------------------------------
     (C) Fetch questions
     ------------------------------ */
  const fetchQuestions = useCallback(async () => {
    // Monotonic request id: rapid filter/page changes can resolve out of order,
    // so only the most recent request is allowed to apply its results.
    const seq = ++fetchSeqRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { currentPage, pageSize, filters } = state;
      let data: QuestionType[] = [];
      let totalCount = 0;

      if (source) {
        const result = await source.loadQuestions(filters, currentPage, pageSize);
        if (seq !== fetchSeqRef.current) return; // superseded by a newer request
        data = result.data;
        totalCount = result.totalCount;
      } else {
        const { exams, subjects, topics, subtopics, difficulties, years, types, customTags } =
          filters;

        const arrToComma = (arr: string[]) => arr.join(",");

        const params = new URLSearchParams();
        if (exams.length) params.set("exam", arrToComma(exams));
        if (subjects.length) params.set("subject", arrToComma(subjects));
        if (topics.length) params.set("topic", arrToComma(topics));
        if (subtopics.length) params.set("subtopic", arrToComma(subtopics));
        if (difficulties.length) params.set("difficulty", arrToComma(difficulties));
        if (years.length) params.set("year", arrToComma(years));
        if (types.length) params.set("type", arrToComma(types));

        // NEW: customTags
        if (customTags.length) {
          params.set("customTags", arrToComma(customTags));
        }

        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));

        const url = `/api/questions?${params.toString()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch questions. ${txt}`);
        }
        const result = await res.json();
        if (seq !== fetchSeqRef.current) return; // superseded by a newer request

        if (Array.isArray(result)) {
          // If the API returns a plain array
          data = result;
          totalCount = data.length;
        } else if (result.data) {
          // If the API returns { data, totalCount }
          data = result.data;
          totalCount = result.totalCount;
        }
      }

      // Sort by numeric portion of questionId — global bank only (its ids look
      // like "Q123"). An injected source already returns rows in authored order
      // (the bank API uses orderBy: { order: "asc" }); re-sorting by a CUID's
      // arbitrary digit run would scramble it.
      if (!source) {
        data = data.sort((a, b) => {
          const aId = a.questionId?.match(/\d+/)?.[0] || "0";
          const bId = b.questionId?.match(/\d+/)?.[0] || "0";
          return parseInt(aId, 10) - parseInt(bId, 10);
        });
      }

      dispatch({ type: "SET_QUESTIONS", payload: data });
      dispatch({ type: "SET_TOTAL_COUNT", payload: totalCount });
    } catch (err) {
      console.error("Error fetching questions:", err);
      // *** Improved toast styling for error
      toast({
        title: "Error",
        description: "Failed to load questions. Try again later.",
        variant: "destructive",
      });
    } finally {
      // Only the latest request clears the loading flag.
      if (seq === fetchSeqRef.current) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, [state.filters, state.currentPage, state.pageSize, toast, source]);

  // Initial load of filter options (stats handled by the filters effect below)
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Re-fetch questions whenever filters/page change
  useEffect(() => {
    fetchQuestions();
  }, [state.filters, state.currentPage, fetchQuestions]);

  // Stats depend only on filters — don't re-run the COUNT scans on page change.
  useEffect(() => {
    fetchGlobalStats();
  }, [state.filters, fetchGlobalStats]);

  /* ------------------------------
     8) Handlers (mark complete, etc.)
     ------------------------------ */
  const handleMarkComplete = useCallback(
    async (questionId: string, newVal?: boolean) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        const val = newVal ?? true;
        const wasCompleted = state.questions.find((q) => q.questionId === questionId)?.completed ?? false;
        const ok = await persistProgress({ questionId, completed: val });
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: val } : q
          ),
        });
        // Keep the header "answered" count live (it's otherwise fetched once and
        // cached, so attempts didn't appear until reload).
        if (ok && val !== wasCompleted) {
          dispatch({
            type: "SET_GLOBAL_STATS",
            payload: {
              ...state.globalStats,
              completed: Math.max(0, state.globalStats.completed + (val ? 1 : -1)),
            },
          });
        }
      } catch (err) {
        console.error("Error marking complete:", err);
        toast({
          title: "Error",
          description: "Could not mark question as complete.",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.questions, state.globalStats, toast, persistProgress]
  );

  const handleMarkForReview = useCallback(
    async (questionId: string, newVal?: boolean) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        const val = newVal ?? true;
        await persistProgress({ questionId, reviewed: val });
        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, reviewed: val } : q
          ),
        });
      } catch (err) {
        console.error("Error marking review:", err);
        toast({
          title: "Error",
          description: "Could not update the review flag.",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.questions, toast, persistProgress]
  );

  const handleOptionClick = useCallback(
    (questionId: string, option: string, correct: string) => {
      // Grade with the shared grader so Multiple Correct (and letter/text
      // mismatches) score correctly; fall back to a direct compare if the
      // question isn't found.
      const q = state.questions.find((x) => x.questionId === questionId);
      const graded = q ? gradeAnswer(normalizeQuestion(q), option) : option === correct;
      const isCorrect = graded === true;
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
      recordAnswer(questionId, option);
    },
    [state.feedback, state.selectedOptions, state.questions, recordAnswer]
  );

  const handleNumericalSubmit = useCallback(
    async (questionId: string, userAns: string, correctAns: string) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      try {
        const q = state.questions.find((x) => x.questionId === questionId);
        // null => not auto-gradable (Subjective): record the answer without a
        // correct/incorrect verdict.
        const graded = q ? gradeAnswer(normalizeQuestion(q), userAns) : userAns === correctAns;
        dispatch({
          type: "SET_FEEDBACK",
          payload: {
            ...state.feedback,
            [questionId]: graded === null ? undefined : graded ? "correct" : "incorrect",
          },
        });
        dispatch({
          type: "SET_NUMERICAL_ANSWERS",
          payload: { ...state.numericalAnswers, [questionId]: userAns },
        });

        await persistProgress({ questionId, completed: true });
        recordAnswer(questionId, userAns);

        dispatch({
          type: "SET_QUESTIONS",
          payload: state.questions.map((q) =>
            q.questionId === questionId ? { ...q, completed: true } : q
          ),
        });
      } catch (err) {
        console.error("Error marking numeric answer:", err);
        toast({
          title: "Error",
          description: "Could not submit numeric answer.",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.feedback, state.numericalAnswers, state.questions, toast, persistProgress, recordAnswer]
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

        await persistProgress({ questionId, completed: false, reviewed: false });
      } catch (err) {
        console.error("Error resetting question:", err);
        toast({
          title: "Error",
          description: "Could not reset the question.",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [state.feedback, state.selectedOptions, state.numericalAnswers, state.questions, toast, persistProgress]
  );

  /* ------------------------------
     9) Filtered local questions
     ------------------------------ */
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

  /* ------------------------------
     10) Progress Card
     ------------------------------ */
  function ProgressCard() {
    const total = state.globalStats.total;
    const answered = state.globalStats.completed;
    const reviewed = state.globalStats.reviewed;
    const notAnswered = state.globalStats.notAnswered;
    const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;

    return (
      <Card className="paper-sheet mb-6">
        <CardContent className="p-5 sm:p-6">
          {/* Attempt-sheet summary: one ledger line, not stat tiles */}
          <div className="flex items-baseline justify-between gap-4">
            <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
              Attempt sheet
            </p>
            <p className="type-data text-sm text-ink">
              {answered}
              <span className="text-pencil">/{total}</span>
              <span className="ml-2 text-pencil">{progressPct}% inked</span>
            </p>
          </div>
          <Progress value={progressPct} className="mt-3 h-1 w-full bg-rule" />
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2 text-sm text-pencil">
              <span className="h-2 w-2 rounded-full bg-st-answered" aria-hidden="true" />
              <span className="type-data text-ink">{answered}</span> answered
            </span>
            <span className="flex items-center gap-2 text-sm text-pencil">
              <span className="h-2 w-2 rounded-full bg-st-review" aria-hidden="true" />
              <span className="type-data text-ink">{reviewed}</span> marked for review
            </span>
            <span className="flex items-center gap-2 text-sm text-pencil">
              <span className="h-2 w-2 rounded-full bg-st-notvisited" aria-hidden="true" />
              <span className="type-data text-ink">{notAnswered}</span> unattempted
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ------------------------------
     11) Loading Skeleton
     ------------------------------ */
  // Only the INITIAL load blanks to the skeleton. Per-question actions
  // (checking an answer, marking complete, flagging) update state in place —
  // gating the skeleton on actionLoading made the whole bank "reload" on every
  // attempt, which users found jarring.
  if (state.loading) {
    return (
      <div className="w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          <h1 className="mb-2 text-left text-3xl sm:text-4xl">{headerTitle}</h1>
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
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
              <div key={i} className="paper-sheet mb-4 p-4">
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
     12) MOBILE VIEW
     ------------------------------------------------------------------ */
  if (state.viewMode === ViewMode.MOBILE) {
    if (!filteredQuestions.length) {
      return (
        <div className="min-h-screen p-4">
          <div className="max-w-3xl mx-auto">
            {/* Keep filter access so the user can fix the empty result */}
            <div className="mb-6 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.DESKTOP })}
              >
                Desktop view
              </Button>
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex min-h-11 items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="fixed top-0 left-0 w-screen h-screen bg-paper text-ink flex flex-col custom-scrollbar pt-10 sm:w-[500px] sm:h-auto sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md"
                >
                  <FiltersDialogMobile
                    open={filtersOpenMobile}
                    onOpenChange={setFiltersOpenMobile}
                    state={state}
                    dispatch={dispatch}
                    visibleFacets={visibleFacets}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="paper-sheet p-6 text-center sm:p-10">
              <p className="text-ink">No questions match these filters.</p>
              <p className="mt-1 text-sm text-pencil">
                Open Filters to clear one and see more.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Single question for mobile
    const currentQ = filteredQuestions[mobileIndex];
    const total = filteredQuestions.length;
    const displayNumber = mobileIndex + 1;

    return (
      <div className="min-h-screen p-4">
        <div className="max-w-3xl mx-auto">
          {/* Top bar */}
          <div className="flex justify-between items-center gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.DESKTOP })}
            >
              Desktop View
            </Button>
            <div className="flex items-center gap-2">
              <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex min-h-11 items-center"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={`
                    fixed top-0 left-0 w-screen h-screen
                    bg-paper text-ink
                    flex flex-col custom-scrollbar
                    pt-10
                    sm:w-[500px] sm:h-auto sm:max-h-[90vh]
                    sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                    sm:rounded-md
                  `}
                >
                  <FiltersDialogMobile
                    open={filtersOpenMobile}
                    onOpenChange={setFiltersOpenMobile}
                    state={state}
                    dispatch={dispatch}
                    visibleFacets={visibleFacets}
                  />
                </DialogContent>
              </Dialog>

              <span className="type-data text-sm text-pencil">
                {displayNumber} / {total}
              </span>
            </div>
          </div>

          {/* Button for progress modal */}
          <Button
            variant="outline"
            size="sm"
            className="mb-4 min-h-11"
            onClick={() => setProgressOpen(true)}
          >
            View Progress
          </Button>

          <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
  <DialogContent
    className={`
      fixed inset-0       /* fills mobile screen */
      sm:fixed sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
      w-screen h-screen   /* full for mobile */
      sm:w-[500px] sm:h-auto sm:max-h-[90vh]
      bg-paper text-ink
      sm:rounded-md
      flex flex-col
    `}
  >
    {/* Position close button absolutely */}
    <DialogClose className="absolute top-4 right-4">
      <Button variant="ghost" size="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 8.586l3.95-3.95a1 1 0 111.414 1.414L11.414 10l3.95 3.95a1 1 0 01-1.414 1.414L10 11.414l-3.95 3.95a1 1 0 01-1.414-1.414L8.586 10l-3.95-3.95A1 1 0 016.05 4.636L10 8.586z"
            clipRule="evenodd"
          />
        </svg>
      </Button>
    </DialogClose>

    {/* Title or top bar */}
    <div className="px-4 pb-4 pt-10 sm:pt-4 sm:pb-0">
      <h2 className="text-xl font-semibold">Progress</h2>
    </div>

    {/* Scrollable body */}
    <ScrollArea className="px-4 flex-1 custom-scrollbar">
      <ProgressCard />
    </ScrollArea>
  </DialogContent>
</Dialog>


          {/* Single question in mobile */}
          <Question
            key={currentQ.questionId}
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
            showCustomTags={features.customTags}
            showReportIssue={features.community}
            showDiscussion={features.community}
            showDifficultyRating={features.difficultyRating}
            learningMode={features.learningMode}
          />

          {/* Next/Prev on mobile */}
          <div className="flex justify-between gap-3 mt-6">
            <Button
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => setMobileIndex(Math.max(0, mobileIndex - 1))}
              disabled={mobileIndex === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1"
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
     13) DESKTOP VIEW
     ------------------------------------------------------------------ */
  // Note: we intentionally do NOT early-return on an empty result here — the
  // search, filters, status row and the attempt/answer sheets must stay on
  // screen so the user can adjust the filters that produced no matches. The
  // empty message is shown in the question-list area below instead.

  return (
    <TooltipProvider>
      <div className="w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
        <div className="max-w-6xl w-full">
          {/* Switch to Mobile */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: ViewMode.MOBILE })}
            >
              Switch to mobile view
            </Button>
          </div>

          <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
            {headerEyebrow}
          </p>
          <h1 className="type-display mb-2 mt-1 text-left text-3xl sm:text-4xl">
            {headerTitle}
          </h1>

          {!source && (
            <a
              href="/my-banks/new"
              className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md border border-rule bg-secondary/40 px-4 py-2.5 text-sm transition-colors hover:border-ballpoint/40"
            >
              <span className="text-ink">
                <strong>Bring your own material</strong>
                <span className="text-pencil"> — build a private bank or mock exam from your notes.</span>
              </span>
              <span className="type-data shrink-0 text-ballpoint">Create one →</span>
            </a>
          )}

          {/* Search + mobile filters + navigator */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search questions"
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
                className="bg-paper pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil" />
            </div>

            {/* Mobile filters button (hidden on desktop) */}
            <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="sm:hidden flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent
                className="
                  fixed top-0 left-0 w-screen h-screen
                  sm:w-[500px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
                  bg-paper text-ink
                  flex flex-col custom-scrollbar
                  pt-10
                "
              >
                <FiltersDialogMobile
                  open={filtersOpenMobile}
                  onOpenChange={setFiltersOpenMobile}
                  state={state}
                  dispatch={dispatch}
                  visibleFacets={visibleFacets}
                />
              </DialogContent>
            </Dialog>

            {/* Desktop question navigator */}
            <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hidden sm:flex">
                  Answer sheet
                </Button>
              </DialogTrigger>
              <DialogContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="paper-sheet sm:max-w-2xl sm:max-h-[85vh]"
              >
                <DialogHeader className="text-left">
                  <DialogTitle className="type-display text-lg text-ink">Answer sheet</DialogTitle>
                  <p className="text-sm text-pencil">Tap a number to jump to that question.</p>
                </DialogHeader>

                {/* Status summary */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-rule py-3">
                  {(
                    [
                      ["answered", "Answered", "bg-st-answered"],
                      ["review", "For review", "bg-st-review"],
                      ["notvisited", "Not visited", "bg-st-notvisited"],
                    ] as const
                  ).map(([key, label, dot]) => {
                    const n = filteredQuestions.filter((q) =>
                      key === "answered"
                        ? q.completed
                        : key === "review"
                        ? !q.completed && q.reviewed
                        : !q.completed && !q.reviewed
                    ).length;
                    return (
                      <span key={key} className="flex items-center gap-2 text-sm text-pencil">
                        <span className={`h-2.5 w-2.5 rounded-sm ${dot}`} />
                        <span className="type-data text-ink">{n}</span> {label}
                      </span>
                    );
                  })}
                </div>

                <ScrollArea className="h-[55vh] custom-scrollbar">
                  <div className="grid grid-cols-6 gap-2.5 py-4 sm:grid-cols-10">
                    {filteredQuestions.map((q, index) => {
                      const absoluteIndex = (state.currentPage - 1) * state.pageSize + index;
                      const displayNum = absoluteIndex + 1;
                      const tile = q.completed
                        ? "border-st-answered bg-st-answered text-paper"
                        : q.reviewed
                        ? "border-st-review bg-st-review text-paper"
                        : "border-rule bg-paper text-pencil hover:border-ballpoint hover:text-ballpoint";
                      const status = q.completed ? "answered" : q.reviewed ? "for review" : "not visited";
                      return (
                        <button
                          key={q.questionId}
                          type="button"
                          aria-label={`Go to question ${displayNum} (${status})`}
                          onClick={() => {
                            const el = document.getElementById(`question-${q.questionId}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            setNavigatorOpen(false);
                          }}
                          className={`flex h-10 w-10 items-center justify-center rounded-md border type-data text-sm font-medium transition-colors ${tile}`}
                        >
                          {displayNum}
                        </button>
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

          {/* Status filter row (desktop) — speaks the CBT legend */}
          <div className="hidden sm:flex gap-2 mb-2">
            {(
              [
                { key: "all", label: "All", dot: "bg-ballpoint" },
                { key: "complete", label: "Answered", dot: "bg-st-answered" },
                { key: "review", label: "Marked for review", dot: "bg-st-review" },
                { key: "incomplete", label: "Unattempted", dot: "bg-st-notvisited" },
              ] as const
            ).map(({ key, label, dot }) => {
              const isActive = state.filters.status === key;
              return (
                <button
                  key={key}
                  onClick={() =>
                    dispatch({ type: "SET_FILTERS", payload: { ...state.filters, status: key } })
                  }
                  aria-pressed={isActive}
                  className={`
                    flex min-h-11 items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors
                    ${
                      isActive
                        ? "border-ink bg-paper font-medium text-ink"
                        : "border-rule bg-transparent text-pencil hover:border-pencil"
                    }
                  `}
                >
                  <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Desktop Filter Popovers (facets gated by features) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
            {visibleFacets.map((filterType) => {
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
                    <div className="p-2 w-full sm:w-80 rounded-md border border-rule bg-paper custom-scrollbar max-h-60 overflow-auto">
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
                    className={`
                      flex w-full sm:w-36 min-h-11 items-center justify-between
                      rounded-md border px-4 py-2 text-sm capitalize
                      transition-colors duration-75
                      ${
                        state.filters[filterType].length
                          ? "border-ballpoint bg-paper text-ballpoint"
                          : "border-rule bg-paper text-pencil hover:border-pencil"
                      }
                    `}
                  >
                    <p>
                      {state.filters[filterType].length
                        ? `${state.filters[filterType].length} selected`
                        : filterType === "customTags"
                        ? "my tags"
                        : filterType}
                    </p>
                    <ChevronDown className="h-4 w-4 transition-all" />
                  </button>
                </Popover>
              );
            })}
          </div>

          {/* Desktop: Questions List + Pagination */}
          {filteredQuestions.length > 0 ? (
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
                    showCustomTags={features.customTags}
                    showReportIssue={features.community}
                    showDiscussion={features.community}
                    showDifficultyRating={features.difficultyRating}
                    learningMode={features.learningMode}
                  />
                );
              })}
              {features.pagination && (
                <Pagination
                  currentPage={state.currentPage}
                  totalCount={state.totalCount}
                  pageSize={state.pageSize}
                  onPageChange={(p) => {
                    dispatch({ type: "SET_CURRENT_PAGE", payload: p });
                  }}
                />
              )}
            </>
          ) : (
            <div className="paper-sheet mt-2 p-6 text-center sm:p-10">
              <p className="text-ink">No questions match these filters.</p>
              <p className="mt-1 text-sm text-pencil">
                Clear a filter or your search above to see more.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Persistent answer-sheet trigger — the toolbar button scrolls away, so this
          stays fixed in sight while the user moves down the list, letting them jump
          between questions from anywhere. Opens the SAME navigator dialog (controlled
          by navigatorOpen). Bottom-right, clear of the centered Bar pill. */}
      <button
        type="button"
        onClick={() => setNavigatorOpen(true)}
        aria-label="Open the answer sheet to jump between questions"
        className="fixed bottom-6 right-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-rule bg-paper/95 px-4 py-2.5 text-sm font-medium tracking-tight text-ink shadow-[0_4px_20px_-8px_rgba(30,39,73,0.28)] backdrop-blur transition-all hover:border-ballpoint/50 hover:bg-secondary active:translate-y-px sm:right-6"
      >
        <LayoutGrid className="h-[18px] w-[18px] text-ballpoint" />
        <span className="hidden sm:inline">Answer sheet</span>
      </button>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------
   14) Desktop Filter Search Sub-component
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

  // 1) Filter by searchTerm
  // 2) Sort so that selected items are at the top
  const displayedValues = useMemo(() => {
    let arr = [...filterValues]; // copy — .sort() mutates, and filterValues is state
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      arr = arr.filter((val) => val.toLowerCase().includes(lower));
    }
    // Sort selected items first
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
        placeholder={`Search ${filterType.toLowerCase()}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2 bg-paper"
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
              transition={transitionProps}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
                transition-colors
                ${
                  isSelected
                    ? "text-ballpoint ring-ballpoint bg-secondary"
                    : "text-pencil ring-rule bg-transparent hover:bg-secondary"
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
                      <div className="w-3.5 h-3.5 rounded-full bg-ballpoint flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-paper" strokeWidth={2} />
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

/* ------------------------------------------------------------------
   15) Mobile Filters Dialog
   ------------------------------------------------------------------ */
function FiltersDialogMobile({
  open,
  onOpenChange,
  state,
  dispatch,
  visibleFacets = ALL_FACETS,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  state: StateType;
  dispatch: React.Dispatch<ActionType>;
  visibleFacets?: FilterKey[];
}) {
  return (
    <FiltersDialog
      open={open}
      onOpenChange={onOpenChange}
      state={state}
      dispatch={dispatch}
      visibleFacets={visibleFacets}
    />
  );
}

/* ------------------------------------------------------------------
   16) Actual Filters Dialog Content (Mobile)
   ------------------------------------------------------------------ */
interface CustomFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: StateType;
  dispatch: React.Dispatch<ActionType>;
  visibleFacets?: FilterKey[];
}

function FiltersDialog({
  open,
  onOpenChange,
  state,
  dispatch,
  visibleFacets = ALL_FACETS,
}: CustomFiltersDialogProps) {
  const [searches, setSearches] = useState<Record<FilterKey, string>>({
    exams: "",
    subjects: "",
    topics: "",
    subtopics: "",
    difficulties: "",
    years: "",
    types: "",
    customTags: "", // new
  });

  const handleSearchChange = (category: FilterKey, value: string) => {
    setSearches((prev) => ({ ...prev, [category]: value }));
  };

  // filter & sort selected to top
  const filterAndSort = (items: string[], cat: FilterKey) => {
    let arr = [...items]; // copy — .sort() below mutates in place
    const st = searches[cat]?.toLowerCase() || "";
    if (st) {
      arr = arr.filter((it) => it.toLowerCase().includes(st));
    }
    // selected => top
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

  // Reusable ring style for the status row
  function mobileStatusStyle(selected: boolean) {
    return `
      inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
      whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
      transition-all duration-200 ease-in-out
      ${
        selected
          ? "bg-secondary text-ballpoint ring-ballpoint"
          : "bg-transparent text-pencil ring-rule hover:bg-secondary"
      }
    `;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`
          w-screen h-screen bg-paper text-ink
          custom-scrollbar pt-10
          sm:w-[500px] sm:h-auto sm:max-h-[90vh]
          sm:left-1/2 sm:top-1/2 sm:fixed sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
        `}
        style={{ overflowY: "auto" }}
      >
        {/* top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
          <h2 className="type-display text-2xl">
            Filters
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-pencil hover:text-ink transition-all"
          >
            ✕
          </Button>
        </div>

        <ScrollArea className="px-4 py-4 flex-1 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Status row */}
            <div>
              <p className="type-display text-2xl mb-2">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {["all", "complete", "review", "incomplete"].map((st) => {
                  const selected = state.filters.status === st;
                  return (
                    <button
                      key={st}
                      className={mobileStatusStyle(selected)}
                      onClick={() =>
                        dispatch({
                          type: "SET_FILTERS",
                          payload: { ...state.filters, status: st },
                        })
                      }
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* One section per visible facet (banks hide exam/year/subtopic/tags) */}
            {visibleFacets.map((facet) => (
              <MobileFilterSection
                key={facet}
                title={facet}
                items={filterAndSort(state.filterOptions[facet], facet)}
                searchValue={searches[facet]}
                onSearchChange={(val) => handleSearchChange(facet, val)}
                selectedItems={state.filters[facet]}
                toggleItem={(item) => toggleItem(facet, item)}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
   17) Mobile Filter Section
   ------------------------------------------------------------------ */
interface MobileFilterSectionProps {
  title: string;
  items: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedItems: string[];
  toggleItem: (item: string) => void;
}

function MobileFilterSection({
  title,
  items,
  searchValue,
  onSearchChange,
  selectedItems,
  toggleItem,
}: MobileFilterSectionProps) {
  function mobileItemStyle(selected: boolean) {
    return `
      inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
      whitespace-nowrap overflow-hidden ring-1 ring-inset tracking-tight
      transition-all duration-200 ease-in-out
      ${
        selected
          ? "bg-secondary text-ballpoint ring-ballpoint"
          : "bg-transparent text-pencil ring-rule hover:bg-secondary"
      }
    `;
  }

  return (
    <div className="space-y-4">
      <h3 className="type-display text-2xl">
        {title === "customTags" ? "My Tags" : transformFilterItem(title)}
      </h3>
      <div className="relative">
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-paper pl-10 py-2"
        />
        <Search className="absolute left-3 top-3 h-5 w-5 text-pencil" />
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isSelected = selectedItems.includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleItem(item)}
              className={mobileItemStyle(isSelected)}
            >
              <span className="mr-1.5">{transformFilterItem(item)}</span>
              {isSelected && (
                <span className="flex-shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-ballpoint flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-paper" strokeWidth={3} />
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
