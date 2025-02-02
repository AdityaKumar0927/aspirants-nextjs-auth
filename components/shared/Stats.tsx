"use client";

import React, { useEffect, useReducer, useMemo, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Filter, Search } from "lucide-react";
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
  Cell
} from "recharts";

/* ------------------------------------------------------------------
   1) Enums & Types
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

interface StatsState {
  filters: FiltersType;
  filterOptions: FilterOptionsType;
  dropdowns: Record<FilterKey, boolean>;
  loading: boolean;
  filterOptionsLoading: boolean;
  viewMode: ViewMode;

  performance: PerformanceRow[];
  totalCorrect: number;
  totalIncorrect: number;
  totalAttempts: number;
  avgAccuracy: number;
  avgReattempt: number;

  searchQuery: string;
}

interface PerformanceRow {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAttempted: number;
  accuracy: number;
  reattemptAccuracy: number;
  createdAt: string;
}

/* ------------------------------------------------------------------
   2) The initial state
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
  performance: [],
  totalCorrect: 0,
  totalIncorrect: 0,
  totalAttempts: 0,
  avgAccuracy: 0,
  avgReattempt: 0,
  searchQuery: "",
};

/* ------------------------------------------------------------------
   3) Action definitions
   ------------------------------------------------------------------ */
type StatsAction =
  | { type: "SET_FILTER_OPTIONS"; payload: FilterOptionsType }
  | { type: "SET_FILTERS"; payload: FiltersType }
  | { type: "SET_DROPDOWN"; payload: { key: FilterKey; value: boolean } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_FILTER_OPTIONS_LOADING"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_PERFORMANCE"; payload: PerformanceRow[] }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | {
      type: "SET_AGGREGATES";
      payload: {
        totalCorrect: number;
        totalIncorrect: number;
        totalAttempts: number;
        avgAccuracy: number;
        avgReattempt: number;
      };
    };

/* ------------------------------------------------------------------
   4) Helpers
   ------------------------------------------------------------------ */
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function transformFilterItem(value: string): string {
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

/* ------------------------------------------------------------------
   5) The reducer
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
    case "SET_PERFORMANCE":
      return { ...state, performance: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_AGGREGATES":
      return {
        ...state,
        totalCorrect: action.payload.totalCorrect,
        totalIncorrect: action.payload.totalIncorrect,
        totalAttempts: action.payload.totalAttempts,
        avgAccuracy: action.payload.avgAccuracy,
        avgReattempt: action.payload.avgReattempt,
      };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------
   6) Stats component
   ------------------------------------------------------------------ */
export default function Stats() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [state, dispatch] = React.useReducer(reducer, initialState);

  // Fix for the mobile filters logic: we must define these states
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: "mobile" });
    }
  }, []);

  /* 6(A) fetch filter options once */
  const fetchFilterOptions = React.useCallback(async () => {
    dispatch({ type: "SET_FILTER_OPTIONS_LOADING", payload: true });
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
      console.error("fetchFilterOptions error:", err);
      toast({
        title: "Error",
        description: "Could not load filter fields. Try again later.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_FILTER_OPTIONS_LOADING", payload: false });
    }
  }, [toast]);

  /* 6(B) fetch user performance with the filters */
  const fetchPerformance = React.useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const arrToComma = (arr: string[]) => arr.join(",");
      const { filters } = state;
      const params = new URLSearchParams();
      if (filters.exams.length)       params.set("exam", arrToComma(filters.exams));
      if (filters.subjects.length)    params.set("subject", arrToComma(filters.subjects));
      if (filters.topics.length)      params.set("topic", arrToComma(filters.topics));
      if (filters.subtopics.length)   params.set("subtopic", arrToComma(filters.subtopics));
      if (filters.difficulties.length) params.set("difficulty", arrToComma(filters.difficulties));
      if (filters.years.length)       params.set("year", arrToComma(filters.years));
      if (filters.types.length)       params.set("type", arrToComma(filters.types));

      // If your API supports status param:
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status);
      }

      const url = `/api/user-performance/get?${params.toString()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch user performance data.");
      const raw = await res.json() as PerformanceRow[];
      dispatch({ type: "SET_PERFORMANCE", payload: raw });
    } catch (err) {
      console.error("fetchPerformance error:", err);
      toast({
        title: "Error",
        description: "Failed to load performance data. Try again.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.filters, toast]);

  // On mount => fetch filter options
  React.useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Whenever filters change => refetch performance
  React.useEffect(() => {
    fetchPerformance();
  }, [state.filters, fetchPerformance]);

  /* 6(C) compute aggregates */
  React.useEffect(() => {
    if (!state.performance.length) {
      dispatch({
        type: "SET_AGGREGATES",
        payload: { totalCorrect: 0, totalIncorrect: 0, totalAttempts: 0, avgAccuracy: 0, avgReattempt: 0 },
      });
      return;
    }
    let sumCorrect = 0, sumIncorrect = 0, sumAttempts = 0;
    let sumAcc = 0, sumRe = 0;
    for (const row of state.performance) {
      sumCorrect += row.correctAnswers;
      sumIncorrect += row.incorrectAnswers;
      sumAttempts += row.questionsAttempted;
      sumAcc += row.accuracy;
      sumRe += row.reattemptAccuracy;
    }
    const n = state.performance.length;
    const avgAcc = n ? sumAcc / n : 0;
    const avgRe  = n ? sumRe / n : 0;
    dispatch({
      type: "SET_AGGREGATES",
      payload: {
        totalCorrect: sumCorrect,
        totalIncorrect: sumIncorrect,
        totalAttempts: sumAttempts,
        avgAccuracy: avgAcc,
        avgReattempt: avgRe,
      },
    });
  }, [state.performance]);

  /* 7) Build chart data from performance */
  const chartData = React.useMemo(() => {
    if (!state.performance.length) return [];
    return state.performance.map((row, i) => ({
      index: i,
      correct: row.correctAnswers,
      incorrect: row.incorrectAnswers,
      attempts: row.questionsAttempted,
      accuracy: row.accuracy,
    }));
  }, [state.performance]);

  // Loading skeleton if needed
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

  // If no data
  const hasData = state.performance.length > 0;
  const userName = (session && session.user?.name) ? session.user.name : "Guest";

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Title with user name */}
      <h1 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem] mb-6">
        {userName}&apos;s Performance
      </h1>

      {/* Desktop filters + Status row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Status row (like QBC) */}
        <div className="space-x-2 hidden sm:flex">
          {["all", "complete", "review", "incomplete"].map((st) => {
            const isActive = state.filters.status === st;
            return (
              <button
                key={st}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border border-blue-400"
                    : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 hover:border-gray-500"
                }`}
                onClick={() => {
                  const newFilters = { ...state.filters, status: st };
                  dispatch({ type: "SET_FILTERS", payload: newFilters });
                }}
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
                  onClick={() =>
                    dispatch({
                      type: "SET_DROPDOWN",
                      payload: { key: fKey, value: !isOpen },
                    })
                  }
                >
                  {fKey} ({state.filters[fKey].length})
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
                {isOpen && (
                  <div className="absolute z-50 bg-white dark:bg-gray-800 p-3 rounded-md shadow-md max-h-64 w-64 overflow-auto">
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

        {/* Mobile filter button (hidden on desktop) */}
        <Button
          variant="outline"
          className="sm:hidden flex items-center"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* If we have data => show aggregates & charts */}
      {hasData ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader><CardTitle>Avg Accuracy</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{state.avgAccuracy.toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Reattempt Accuracy</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{state.avgReattempt.toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Correct</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{state.totalCorrect}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Attempts</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{state.totalAttempts}</p>
              </CardContent>
            </Card>
          </div>

          {/* BarChart example */}
          <Card>
            <CardHeader>
              <CardTitle>Correct vs. Incorrect (Stacked)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="correct" fill="#22c55e" name="Correct" stackId="a" />
                    <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Another chart: line for accuracy */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Accuracy Over Rows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-300 mt-6">
          No performance data found with these filters.
        </p>
      )}

      {/* Mobile Filters Dialog */}
      <MobileFiltersDialog
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
}

/* DesktopFilterSearch sub-component */
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
    // Sort selected items to the top
    arr.sort((a, b) => {
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
      dispatch({ type: "SET_FILTERS", payload: { ...state.filters, [filterType]: newArr }});
    },
    [state.filters, filterType, dispatch]
  );

  return (
    <>
      <Input
        placeholder={`Search ${filterType}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
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
                text-left px-3 py-1.5 rounded-full text-sm font-medium
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

/* MobileFiltersDialog sub-component */
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
          pt-10
        "
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
            Filters
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </Button>
        </div>
        <ScrollArea className="px-4 py-4 flex-1">
          {/* Status row */}
          <div className="mb-4">
            <p className="text-lg font-medium mb-2">Status</p>
            <div className="flex gap-2">
              {["all","complete","review","incomplete"].map((st) => {
                const selected = state.filters.status === st;
                return (
                  <Button
                    key={st}
                    variant={selected ? "default" : "outline"}
                    size="sm"
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

          {/* All other filters (exams, subjects, etc.) */}
          {(Object.keys(state.filterOptions) as FilterKey[]).map((filterType) => (
            <MobileFilterSection
              key={filterType}
              title={filterType}
              filterType={filterType}
              state={state}
              dispatch={dispatch}
            />
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

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
  const filterValues = state.filterOptions[filterType];

  const displayedValues = React.useMemo(() => {
    let arr = filterValues.slice();
    if (search) {
      const lower = search.toLowerCase();
      arr = arr.filter((val) => val.toLowerCase().includes(lower));
    }
    // sort selected
    arr.sort((a, b) => {
      const aSel = state.filters[filterType].includes(a);
      const bSel = state.filters[filterType].includes(b);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
    return arr;
  }, [filterValues, search, state.filters, filterType]);

  function toggleItem(val: string) {
    const isSelected = state.filters[filterType].includes(val);
    let newArr: string[];
    if (isSelected) {
      newArr = state.filters[filterType].filter((x) => x !== val);
    } else {
      newArr = [...state.filters[filterType], val];
    }
    dispatch({ type: "SET_FILTERS", payload: { ...state.filters, [filterType]: newArr }});
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">{transformFilterItem(title)}</h3>
      <Input
        placeholder={`Search ${title}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2">
        {displayedValues.map((val) => {
          const selected = state.filters[filterType].includes(val);
          return (
            <Button
              key={val}
              variant={selected ? "default" : "outline"}
              size="sm"
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
