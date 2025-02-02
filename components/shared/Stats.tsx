"use client";

import React, {
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Filter,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ------------------------------------------------------------------
   1) Types & Enums
   ------------------------------------------------------------------ */
type ViewMode = "desktop" | "mobile";

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
  status: string; // "all"|"complete"|"review"|"incomplete"
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

/**
 * This is the shape from userPerformance:
 * If you have more fields (like topicPerformance, weaknessBySubtopic, etc.)
 * we can parse them below to build better stats.
 */
interface UserPerformance {
  questionId: string;
  userId?: string;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAttempted: number;
  accuracy: number;           // 0..100
  reattemptAccuracy: number;  // 0..100
  createdAt: string;          // date

  // If your schema has a JSON field for subtopic or topic stats:
  topicPerformance?: any;     // e.g. { [topic: string]: { attempts: number, correct: number } }
  // ... etc.
}

/**
 * If you want to show “completed vs. incomplete,” etc. 
 */
interface UserProgress {
  id: string;
  userId: string;
  questionId: string;
  completed: boolean;
  reviewed: boolean;
  lastAttempted?: string;
}

/**
 * If you want “correct vs. incorrect count” from userAnswers:
 */
interface UserAnswer {
  id: string;
  userId: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

/* 
   Main Stats state with filter logic
*/
interface StatsState {
  filters: FiltersType;
  filterOptions: FilterOptionsType;
  dropdowns: Record<FilterKey, boolean>;

  loading: boolean;              // while fetching stats
  filterOptionsLoading: boolean; // while fetching filter fields
  viewMode: ViewMode;

  // The data sets:
  userPerformance: UserPerformance[];
  userProgress: UserProgress[];
  userAnswers: UserAnswer[];

  // Some aggregated fields
  totalCorrect: number;
  totalIncorrect: number;
  totalAttempts: number;
  avgAccuracy: number;
  avgReattempt: number;

  // Example aggregator for topic
  topicPerfData: { topic: string; attempts: number; correct: number }[];

  searchQuery: string;
}

/* 
   2) Action definitions
*/
type StatsAction =
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptionsType }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_DROPDOWN"; payload: { key: FilterKey; value: boolean } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_FILTER_OPTIONS_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_SEARCH_QUERY"; payload: string }

  | { type: "SET_USER_PERFORMANCE"; payload: UserPerformance[] }
  | { type: "SET_USER_PROGRESS"; payload: UserProgress[] }
  | { type: "SET_USER_ANSWERS"; payload: UserAnswer[] }

  | {
      type: "SET_AGGREGATES";
      payload: {
        totalCorrect: number;
        totalIncorrect: number;
        totalAttempts: number;
        avgAccuracy: number;
        avgReattempt: number;
      };
    }
  | {
      type: "SET_TOPIC_PERF_DATA";
      payload: { topic: string; attempts: number; correct: number }[];
    };

/* ------------------------------------------------------------------
   3) Initial State
   ------------------------------------------------------------------ */
const initialFilters: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  years: [],
  types: [],
  status: "all",
};

const initialFilterOptions: FilterOptionsType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  years: [],
  types: [],
};

const initialState: StatsState = {
  filters: initialFilters,
  filterOptions: initialFilterOptions,
  dropdowns: {
    exams: false,
    subjects: false,
    topics: false,
    subtopics: false,
    difficulties: false,
    years: false,
    types: false,
  },
  loading: false,
  filterOptionsLoading: false,
  viewMode: "desktop",

  userPerformance: [],
  userProgress: [],
  userAnswers: [],

  totalCorrect: 0,
  totalIncorrect: 0,
  totalAttempts: 0,
  avgAccuracy: 0,
  avgReattempt: 0,
  topicPerfData: [],

  searchQuery: "",
};

/* ------------------------------------------------------------------
   4) The reducer
   ------------------------------------------------------------------ */
function reducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case "SET_FILTER_OPTIONS":
      return { ...state, filterOptions: action.payload };

    case "SET_FILTERS":
      return { ...state, filters: action.payload };

    case "SET_DROPDOWN":
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          [action.payload.key]: action.payload.value,
        },
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_FILTER_OPTIONS_LOADING":
      return { ...state, filterOptionsLoading: action.payload };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };

    // userPerformance / userProgress / userAnswers
    case "SET_USER_PERFORMANCE":
      return { ...state, userPerformance: action.payload };
    case "SET_USER_PROGRESS":
      return { ...state, userProgress: action.payload };
    case "SET_USER_ANSWERS":
      return { ...state, userAnswers: action.payload };

    // aggregator
    case "SET_AGGREGATES":
      return {
        ...state,
        totalCorrect: action.payload.totalCorrect,
        totalIncorrect: action.payload.totalIncorrect,
        totalAttempts: action.payload.totalAttempts,
        avgAccuracy: action.payload.avgAccuracy,
        avgReattempt: action.payload.avgReattempt,
      };

    case "SET_TOPIC_PERF_DATA":
      return { ...state, topicPerfData: action.payload };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------
   5) Helper functions
   ------------------------------------------------------------------ */
function transformFilterItem(value: string): string {
  const replaced = value.replace(/-/g, " ");
  return replaced
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

const transitionProps = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

/* ------------------------------------------------------------------
   6) Stats component
   ------------------------------------------------------------------ */
export default function Stats() {
  const { data: session } = useSession(); 
  const userName = session?.user?.name || "Guest";

  const { toast } = useToast();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [state, dispatch] = React.useReducer(reducer, initialState);

  // Decide initial view mode
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: "mobile" });
    }
  }, []);

  /* 6(A) fetch filter options once */
  const fetchFilterOptions = useCallback(async () => {
    dispatch({ type: "SET_FILTER_OPTIONS_LOADING", payload: true });
    try {
      const res = await fetch("/api/filters", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch filter fields.");
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
      console.error("Error fetching filter fields:", err);
      toast({
        title: "Error",
        description: "Could not load filter fields.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_FILTER_OPTIONS_LOADING", payload: false });
    }
  }, [toast]);

  /* 
    6(B) fetch the data for userPerformance, userProgress, userAnswers 
    and apply the filters. 
    But your existing /api/... routes do NOT accept filters, 
    so we can only do them client-side or if you enhance your routes. 
    For demonstration, we’ll fetch them all and filter locally. 
    If your server routes do NOT accept query params, 
    we have to do a local filter. 
  */
  const [rawPerf, setRawPerf] = useState<UserPerformance[]>([]);
  const [rawProg, setRawProg] = useState<UserProgress[]>([]);
  const [rawAns, setRawAns] = useState<UserAnswer[]>([]);

  const fetchAllData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [perfRes, progRes, ansRes] = await Promise.all([
        fetch("/api/user-performance/get", { cache: "no-store" }),
        fetch("/api/user-progress", { cache: "no-store" }),
        fetch("/api/user-answers", { cache: "no-store" }),
      ]);

      if (!perfRes.ok) throw new Error("Failed to fetch userPerformance");
      if (!progRes.ok) throw new Error("Failed to fetch userProgress");
      if (!ansRes.ok) throw new Error("Failed to fetch userAnswers");

      const [perfData, progData, ansData] = await Promise.all([
        perfRes.json() as Promise<UserPerformance[]>,
        progRes.json() as Promise<UserProgress[]>,
        ansRes.json() as Promise<UserAnswer[]>,
      ]);

      // store them in raw states
      setRawPerf(perfData);
      setRawProg(progData);
      setRawAns(ansData);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      toast({
        title: "Error",
        description: "Could not load stats data. Try again.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [toast]);

  // On mount => fetch filter fields + main data
  useEffect(() => {
    fetchFilterOptions();
    fetchAllData();
  }, [fetchFilterOptions, fetchAllData]);

  /* 6(C) local filtering
     Because your routes do not accept query params to filter on the server, 
     we can do a local filter example:
  */
  const applyFilters = useCallback(() => {
    // If your server routes do NOT handle filters, 
    // we locally filter userPerformance, userProgress, userAnswers 
    // by their questionId or something. 
    // But we have no question data to map from, 
    // so let’s demonstrate an approach. 
    // e.g. if status=complete => only userPerformance rows that have correctAnswers = ?

    // For demonstration, we'll just keep them unfiltered. 
    // Or do a small logic for "status" filter. 
    // (Because your userPerformance route has no exam/subject fields.)
    
    // status
    const st = state.filters.status;
    let perf = [...rawPerf];
    // e.g. if st=complete => only rows with 100% accuracy
    if (st === "complete") {
      perf = perf.filter((row) => row.accuracy >= 100);
    } else if (st === "review") {
      // hypothetically we do something else
      perf = perf.filter((row) => row.accuracy < 40);
    } else if (st === "incomplete") {
      perf = perf.filter((row) => row.accuracy < 100);
    }

    dispatch({ type: "SET_USER_PERFORMANCE", payload: perf });

    // userProgress and userAnswers if you want to do something 
    // with them for filtering. We'll skip for brevity. 
    dispatch({ type: "SET_USER_PROGRESS", payload: rawProg });
    dispatch({ type: "SET_USER_ANSWERS", payload: rawAns });
  }, [
    rawPerf,
    rawProg,
    rawAns,
    state.filters.status,
  ]);

  // whenever raw data or filters change => re-apply
  useEffect(() => {
    applyFilters();
  }, [rawPerf, rawProg, rawAns, applyFilters]);

  /* 
    6(D) aggregator after we have userPerformance in state
  */
  useEffect(() => {
    const perf = state.userPerformance;
    if (!perf.length) {
      dispatch({
        type: "SET_AGGREGATES",
        payload: {
          totalCorrect: 0,
          totalIncorrect: 0,
          totalAttempts: 0,
          avgAccuracy: 0,
          avgReattempt: 0,
        },
      });
      dispatch({ type: "SET_TOPIC_PERF_DATA", payload: [] });
      return;
    }

    let sumCorrect = 0, sumIncorrect = 0, sumAttempts = 0;
    let sumAcc = 0, sumRe = 0;
    const topicMap: Record<string, { attempts: number; correct: number }> = {};

    for (const row of perf) {
      sumCorrect += row.correctAnswers;
      sumIncorrect += row.incorrectAnswers;
      sumAttempts += row.questionsAttempted;
      sumAcc += row.accuracy;
      sumRe += row.reattemptAccuracy;

      // if row.topicPerformance is a JSON with structure 
      // { topicName: { correct, attempts } }, sum them
      if (row.topicPerformance && typeof row.topicPerformance === "object") {
        for (const [topic, obj] of Object.entries(row.topicPerformance)) {
          if (!topicMap[topic]) {
            topicMap[topic] = { attempts: 0, correct: 0 };
          }
          topicMap[topic].attempts += (obj as any).attempts ?? 0;
          topicMap[topic].correct += (obj as any).correct ?? 0;
        }
      }
    }

    const n = perf.length;
    const avgAccuracy = n ? sumAcc / n : 0;
    const avgReattempt = n ? sumRe / n : 0;

    dispatch({
      type: "SET_AGGREGATES",
      payload: {
        totalCorrect: sumCorrect,
        totalIncorrect: sumIncorrect,
        totalAttempts: sumAttempts,
        avgAccuracy,
        avgReattempt,
      },
    });

    // Build topicPerf array
    const topicPerfArray = Object.entries(topicMap).map(([topic, stats]) => ({
      topic,
      attempts: stats.attempts,
      correct: stats.correct,
    }));
    // sort by attempts desc
    topicPerfArray.sort((a,b) => b.attempts - a.attempts);
    dispatch({
      type: "SET_TOPIC_PERF_DATA",
      payload: topicPerfArray,
    });
  }, [state.userPerformance]);

  /* 6(E) Build chart data for Recharts from userPerformance. */
  const barData = useMemo(() => {
    return state.userPerformance.map((row, i) => ({
      index: i+1,
      correct: row.correctAnswers,
      incorrect: row.incorrectAnswers,
      attempts: row.questionsAttempted,
      accuracy: row.accuracy,
    }));
  }, [state.userPerformance]);

  // Build topic bar chart data from state.topicPerfData
  // e.g. array of { topic, attempts, correct }
  // we can do a “topic-level correct ratio” 
  const topicBarData = useMemo(() => {
    return state.topicPerfData.map((tp) => {
      const ratio = tp.attempts > 0 ? (tp.correct / tp.attempts)*100 : 0;
      return {
        topic: tp.topic,
        attempts: tp.attempts,
        correctRatio: Number(ratio.toFixed(2)),
      };
    });
  }, [state.topicPerfData]);

  // If loading => skeleton
  if (state.loading || state.filterOptionsLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = state.userPerformance.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 text-gray-900 dark:text-gray-100">
      {/* Title with user name */}
      <h1 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem] mb-8 font-light text-gray-800 dark:text-gray-100">
        {userName}&apos;s Performance
      </h1>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Status row (desktop) */}
        <div className="space-x-2 hidden sm:flex">
          {["all","complete","review","incomplete"].map((st) => {
            const isActive = state.filters.status === st;
            return (
              <button
                key={st}
                onClick={() =>
                  dispatch({
                    type: "SET_FILTERS",
                    payload: { ...state.filters, status: st },
                  })
                }
                className={`
                  px-3 py-1.5 rounded-md transition-colors text-sm tracking-tight font-light
                  ${
                    isActive
                      ? "border border-blue-500 bg-blue-50 text-blue-800"
                      : "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:border-gray-500"
                  }
                `}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Desktop filter popovers */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {(Object.keys(state.filterOptions) as FilterKey[]).map((fKey) => {
            const filterValues = state.filterOptions[fKey] || [];
            const isOpen = state.dropdowns[fKey];
            return (
              <div className="relative" key={fKey}>
                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch({
                      type: "SET_DROPDOWN",
                      payload: { key: fKey, value: !isOpen },
                    });
                  }}
                  className="font-light tracking-tight text-sm"
                >
                  {fKey} ({state.filters[fKey].length})
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
                {isOpen && (
                  <div
                    className="
                      absolute z-50 bg-white dark:bg-gray-800 rounded-md shadow-md
                      max-h-56 w-64 overflow-auto p-2
                      custom-scrollbar
                    "
                  >
                    <DesktopFilterSearch
                      filterType={fKey}
                      filterValues={filterValues}
                      state={state}
                      dispatch={dispatch}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile filter button */}
        <Button
          variant="outline"
          className="sm:hidden flex items-center font-light tracking-tight"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* aggregator row */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-light tracking-tight text-gray-600 dark:text-gray-400">
                  Average Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light">
                  {state.avgAccuracy.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-light tracking-tight text-gray-600 dark:text-gray-400">
                  Reattempt Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light">
                  {state.avgReattempt.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-light tracking-tight text-gray-600 dark:text-gray-400">
                  Total Correct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light">
                  {state.totalCorrect}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-light tracking-tight text-gray-600 dark:text-gray-400">
                  Total Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light">
                  {state.totalAttempts}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stacked bar => correct vs. incorrect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-light tracking-tight">
                Correct vs. Incorrect (Stacked)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="correct" fill="#16a34a" stackId="a" name="Correct" />
                    <Bar dataKey="incorrect" fill="#dc2626" stackId="a" name="Incorrect" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Another chart => line for accuracy */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base font-light tracking-tight">
                Accuracy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="accuracy" stroke="#2563eb" name="Accuracy (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Topic Performance bar (if we have topicPerfData) */}
          {state.topicPerfData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base font-light tracking-tight">
                  Topic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicBarData}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="correctRatio" fill="#14b8a6" name="Correct %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mt-6 font-light">
          No performance data found with these filters.
        </p>
      )}

      {/* Mobile filters */}
      <MobileFiltersDialog
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   7) Desktop Filter Search
   ------------------------------------------------------------------ */
function DesktopFilterSearch({
  filterType,
  filterValues,
  state,
  dispatch,
}: {
  filterType: FilterKey;
  filterValues: string[];
  state: StatsState;
  dispatch: React.Dispatch<StatsAction>;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const displayedValues = useMemo(() => {
    let arr = [...filterValues];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      arr = arr.filter((val) => val.toLowerCase().includes(lower));
    }
    // sort selected items to the top
    arr.sort((a, b) => {
      const aSel = state.filters[filterType].includes(a);
      const bSel = state.filters[filterType].includes(b);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
    return arr;
  }, [filterValues, searchTerm, filterType, state.filters]);

  function toggleItem(val: string) {
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
  }

  return (
    <div className="custom-scrollbar">
      <Input
        type="text"
        placeholder={`Search ${filterType}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2 text-sm font-light"
      />
      <motion.div className="flex flex-col gap-1" layout transition={transitionProps}>
        {displayedValues.map((val) => {
          const isSelected = state.filters[filterType].includes(val);
          return (
            <motion.button
              key={val}
              layout
              initial={false}
              onClick={() => toggleItem(val)}
              animate={{
                backgroundColor: isSelected ? "#EBF8FF" : "transparent",
              }}
              whileHover={{
                backgroundColor: isSelected ? "#CCEAFD" : "#F9FAFB",
              }}
              whileTap={{
                backgroundColor: isSelected ? "#BCE0FD" : "#F3F4F6",
              }}
              transition={{
                ...transitionProps,
                backgroundColor: { duration: 0.1 },
              }}
              className={`
                flex items-center px-3 py-1.5 rounded-md text-sm font-light 
                whitespace-nowrap overflow-hidden 
                border border-transparent
                transition-colors tracking-tight
                ${
                  isSelected
                    ? "text-blue-700"
                    : "text-gray-700 dark:text-gray-300"
                }
              `}
            >
              {transformFilterItem(val)}
              {isSelected && (
                <div className="ml-auto text-blue-500">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------
   8) Mobile Filters 
   ------------------------------------------------------------------ */
function MobileFiltersDialog({
  open,
  onOpenChange,
  state,
  dispatch,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  state: StatsState;
  dispatch: React.Dispatch<StatsAction>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          fixed top-0 left-0 w-screen h-screen
          sm:w-[500px] sm:h-auto sm:max-h-[90vh]
          sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          pt-8
        "
      >
        <div className="flex items-center justify-between px-4 pb-3 border-b dark:border-gray-700">
          <h2 className="text-2xl font-light tracking-tight text-gray-800 dark:text-gray-100">
            Filters
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            ✕
          </Button>
        </div>
        <ScrollArea className="px-4 py-4 flex-1 custom-scrollbar">
          {/* Status row */}
          <div className="mb-6">
            <p className="text-lg font-light text-gray-700 dark:text-gray-300 mb-2 tracking-tight">
              Status
            </p>
            <div className="flex gap-2">
              {["all","complete","review","incomplete"].map((st) => {
                const selected = state.filters.status === st;
                return (
                  <Button
                    key={st}
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    className="font-light tracking-tight"
                    onClick={() => dispatch({
                      type: "SET_FILTERS",
                      payload: { ...state.filters, status: st },
                    })}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* The rest of the filters */}
          {(Object.keys(state.filterOptions) as FilterKey[]).map((fKey) => (
            <MobileFilterSection
              key={fKey}
              title={fKey}
              filterType={fKey}
              state={state}
              dispatch={dispatch}
            />
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
   9) Single mobile filter group 
   ------------------------------------------------------------------ */
function MobileFilterSection({
  title,
  filterType,
  state,
  dispatch,
}: {
  title: string;
  filterType: FilterKey;
  state: StatsState;
  dispatch: React.Dispatch<StatsAction>;
}) {
  const [search, setSearch] = useState("");
  const filterValues = state.filterOptions[filterType] || [];

  const displayedValues = useMemo(() => {
    let arr = [...filterValues];
    if (search) {
      const lower = search.toLowerCase();
      arr = arr.filter((v) => v.toLowerCase().includes(lower));
    }
    // sort selected to top
    arr.sort((a, b) => {
      const aSel = state.filters[filterType].includes(a);
      const bSel = state.filters[filterType].includes(b);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
    return arr;
  }, [filterValues, search, filterType, state.filters]);

  function toggleItem(val: string) {
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
  }

  return (
    <div className="mb-8">
      <p className="text-lg font-light text-gray-700 dark:text-gray-300 mb-2 tracking-tight">
        {transformFilterItem(title)}
      </p>
      <Input
        placeholder={`Search ${title}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 font-light tracking-tight text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {displayedValues.map((val) => {
          const selected = state.filters[filterType].includes(val);
          return (
            <Button
              key={val}
              variant={selected ? "default" : "outline"}
              size="sm"
              className="font-light tracking-tight"
              onClick={() => toggleItem(val)}
            >
              {transformFilterItem(val)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
