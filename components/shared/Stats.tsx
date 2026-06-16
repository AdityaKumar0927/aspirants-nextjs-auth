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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Popover from "@/components/shared/popover";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Check,
  ChevronDown,
  Filter,
  Search,
  Chart,
  Target,
  Refresh,
  Layers,
} from "@/components/desk/icons";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

/**
 * Seed data for rendering <Stats> as a populated DEMO (e.g. the home-page
 * preview) without hitting the API. When provided, the component skips all
 * fetches and uses these arrays so the charts look full for signed-out visitors.
 */
export interface StatsDemoData {
  userName?: string;
  performance: UserPerformance[];
  progress: UserProgress[];
  answers: UserAnswer[];
  filterOptions: FilterOptionsType;
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

const transitionProps: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

/* Desk chart palette — the app forces light theme in this modal, so concrete
   hex (recharts can't read CSS vars in its portalled SVG/tooltip reliably). */
const C = {
  green: "#2e7d4f",
  red: "#be3a28",
  ink: "#1e2749",
  ballpoint: "#2946c4",
  pencil: "#646b80",
  rule: "#e3e5dc",
};

const tooltipProps = {
  contentStyle: {
    background: "#fbfbf8",
    border: "1px solid #e3e5dc",
    borderRadius: 8,
    fontSize: 12,
    color: "#1e2749",
    boxShadow: "0 8px 24px -12px rgba(30,39,73,0.35)",
  },
  labelStyle: { color: "#646b80", fontWeight: 600 },
  cursor: { fill: "rgba(30,39,73,0.05)" },
} as const;

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-paper p-4 sm:p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-ballpoint">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="type-data text-2xl leading-none text-ink">{value}</p>
        <p className="mt-1 truncate text-xs text-pencil">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper-sheet mt-5 p-4 sm:p-5">
      <h2 className="type-display mb-4 text-base text-ink">{title}</h2>
      <div className="h-64">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------
   6) Stats component
   ------------------------------------------------------------------ */
export default function Stats({ demo }: { demo?: StatsDemoData } = {}) {
  const { data: session } = useSession();
  const userName = demo?.userName || session?.user?.name || "Guest";

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
      if (demo) {
        dispatch({ type: "SET_FILTER_OPTIONS", payload: demo.filterOptions });
        return; // finally still clears the loading flag
      }
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
  }, [toast, demo]);

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
      if (demo) {
        setRawPerf(demo.performance);
        setRawProg(demo.progress);
        setRawAns(demo.answers);
        return; // finally still clears the loading flag
      }
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
  }, [toast, demo]);

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
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <Skeleton className="mb-6 h-9 w-56" />
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const hasData = state.userPerformance.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 border-b border-ink/15 pb-5">
        <p className="type-data text-[11px] uppercase tracking-[0.18em] text-pencil">
          Your progress
        </p>
        <h1 className="type-display text-2xl text-ink sm:text-3xl">
          {userName}&apos;s Performance
        </h1>
      </div>

      {/* Status filter row (desktop) — same legend & styling as the Question Bank */}
      <div className="mb-2 hidden gap-2 sm:flex">
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

      {/* Desktop filter popovers — same as the Question Bank */}
      <div className="mb-6 hidden flex-wrap items-center gap-2 sm:flex sm:gap-4">
        {(Object.keys(state.filterOptions) as FilterKey[]).map((filterType) => {
          const filterValues = state.filterOptions[filterType] || [];
          const isOpen = state.dropdowns[filterType];
          return (
            <Popover
              key={filterType}
              align="start"
              openPopover={isOpen}
              setOpenPopover={(open) =>
                dispatch({ type: "SET_DROPDOWN", payload: { key: filterType, value: !!open } })
              }
              content={
                <div className="max-h-60 w-full overflow-auto rounded-md border border-rule bg-paper p-2 custom-scrollbar sm:w-80">
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
                onClick={() =>
                  dispatch({ type: "SET_DROPDOWN", payload: { key: filterType, value: !isOpen } })
                }
                className={`
                  flex min-h-11 w-full items-center justify-between rounded-md border px-4 py-2 text-sm capitalize transition-colors duration-75 sm:w-36
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
                    : filterType}
                </p>
                <ChevronDown className="h-4 w-4 transition-all" />
              </button>
            </Popover>
          );
        })}
      </div>

      {/* Mobile filters button */}
      <button
        className="mb-6 inline-flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2 text-sm tracking-tight text-pencil hover:border-ballpoint hover:text-ink sm:hidden"
        onClick={() => setMobileFiltersOpen(true)}
      >
        <Filter className="h-4 w-4" />
        Filters
      </button>

      {hasData ? (
        <>
          {/* Scoreboard */}
          <div
            className="paper-sheet grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4"
            style={{ backgroundColor: "var(--rule)" }}
          >
            <StatCard
              icon={<Target className="h-5 w-5" />}
              value={`${state.avgAccuracy.toFixed(1)}%`}
              label="Average accuracy"
            />
            <StatCard
              icon={<Refresh className="h-5 w-5" />}
              value={`${state.avgReattempt.toFixed(1)}%`}
              label="Reattempt accuracy"
            />
            <StatCard
              icon={<Check className="h-5 w-5" />}
              value={state.totalCorrect.toLocaleString("en-IN")}
              label="Total correct"
            />
            <StatCard
              icon={<Layers className="h-5 w-5" />}
              value={state.totalAttempts.toLocaleString("en-IN")}
              label="Total attempts"
            />
          </div>

          <ChartCard title="Correct vs. incorrect">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }} barGap={4}>
                <defs>
                  <linearGradient id="gCorrect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="gIncorrect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.red} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={C.red} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke={C.rule} vertical={false} />
                <XAxis dataKey="index" tick={{ fill: C.pencil, fontSize: 12 }} tickLine={false} axisLine={{ stroke: C.rule }} />
                <YAxis tick={{ fill: C.pencil, fontSize: 12 }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip {...tooltipProps} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={9} />
                <Bar dataKey="correct" fill="url(#gCorrect)" stackId="a" name="Correct" maxBarSize={40} />
                <Bar dataKey="incorrect" fill="url(#gIncorrect)" stackId="a" name="Incorrect" maxBarSize={40} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Accuracy trend">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ballpoint} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={C.ballpoint} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke={C.rule} vertical={false} />
                <XAxis dataKey="index" tick={{ fill: C.pencil, fontSize: 12 }} tickLine={false} axisLine={{ stroke: C.rule }} />
                <YAxis domain={[0, 100]} tick={{ fill: C.pencil, fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip {...tooltipProps} />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke={C.ballpoint}
                  strokeWidth={2.5}
                  fill="url(#gAccuracy)"
                  name="Accuracy (%)"
                  dot={{ r: 3, fill: "#ffffff", stroke: C.ballpoint, strokeWidth: 2 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: C.ballpoint }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {state.topicPerfData.length > 0 && (
            <ChartCard title="Topic performance">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicBarData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTopic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ballpoint} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={C.ballpoint} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke={C.rule} vertical={false} />
                  <XAxis dataKey="topic" tick={{ fill: C.pencil, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.rule }} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.pencil, fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="correctRatio" fill="url(#gTopic)" name="Correct %" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      ) : (
        <div className="paper-sheet flex flex-col items-center gap-3 px-4 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-pencil">
            <Chart className="h-7 w-7" />
          </span>
          <p className="type-display text-lg text-ink">No performance data yet</p>
          <p className="type-data max-w-xs text-sm text-pencil">
            Answer questions in the Question Bank — your accuracy, trend, and topic breakdown will
            appear here.
          </p>
        </div>
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
   8) Mobile Filters — same UI & behaviour as the Question Bank
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

  // filter & sort selected to top
  const filterAndSort = (items: string[], cat: FilterKey) => {
    let arr = [...items];
    const st = searches[cat]?.toLowerCase() || "";
    if (st) {
      arr = arr.filter((it) => it.toLowerCase().includes(st));
    }
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
    const newArr = isSel ? oldArr.filter((i) => i !== item) : [...oldArr, item];
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, [category]: newArr },
    });
  };

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
        className="
          fixed top-0 left-0 w-screen h-screen max-w-none max-h-none
          sm:w-[500px] sm:h-auto sm:max-h-[90vh]
          sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
          bg-paper text-ink
          flex flex-col custom-scrollbar
          pt-10
        "
        style={{ overflowY: "auto" }}
      >
        {/* top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
          <h2 className="type-display text-2xl">Filters</h2>
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
              <p className="type-display text-2xl mb-2">Status</p>
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

            {/* Each filter category */}
            {(Object.keys(state.filterOptions) as FilterKey[]).map((fKey) => (
              <MobileFilterSection
                key={fKey}
                title={fKey}
                items={filterAndSort(state.filterOptions[fKey], fKey)}
                searchValue={searches[fKey]}
                onSearchChange={(val) => handleSearchChange(fKey, val)}
                selectedItems={state.filters[fKey]}
                toggleItem={(item) => toggleItem(fKey, item)}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
   9) Single mobile filter group — same UI as the Question Bank
   ------------------------------------------------------------------ */
function MobileFilterSection({
  title,
  items,
  searchValue,
  onSearchChange,
  selectedItems,
  toggleItem,
}: {
  title: string;
  items: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedItems: string[];
  toggleItem: (item: string) => void;
}) {
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
      <h3 className="type-display text-2xl">{transformFilterItem(title)}</h3>
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
