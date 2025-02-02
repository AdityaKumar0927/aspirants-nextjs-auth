"use client";

import React, { useEffect, useReducer, useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Filter, Search } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Legend, Tooltip, Cell, CartesianGrid, XAxis, YAxis } from "recharts";

/* 
  1) Enums and Types
*/
type ViewMode = "desktop" | "mobile";

interface FilterOptionsType {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  years: string[];
  types: string[];
}

type FilterKey = "exams" | "subjects" | "topics" | "subtopics" | "difficulties" | "years" | "types";

interface FiltersType {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  years: string[];
  types: string[];
  // For question status, if we want e.g. "all"|"complete"|"review"|"incomplete"
  // but for performance we might not need it. Let’s omit or keep if needed.
}

interface PerformanceRow {
  // The shape of each row from /api/user-performance/get, filtered by query
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAttempted: number;
  accuracy: number;          // 0..100
  reattemptAccuracy: number; // 0..100
  createdAt: string;         // date
  // ... add more if you like
}

interface StatsState {
  filterOptions: FilterOptionsType;
  filters: FiltersType;
  dropdowns: Record<FilterKey, boolean>;
  loading: boolean;       // for data load
  filterOptionsLoading: boolean; // for filter fetch
  performance: PerformanceRow[];
  viewMode: ViewMode;
  searchQuery: string; // if you also want textual search
}

/*
  2) Action Types
*/
type StatsAction =
  | { type: "SET_FILTER_OPTIONS", payload: FilterOptionsType }
  | { type: "SET_FILTERS", payload: FiltersType }
  | { type: "SET_DROPDOWNS", payload: { key: FilterKey; value: boolean } }
  | { type: "SET_LOADING", payload: boolean }
  | { type: "SET_FILTER_OPTIONS_LOADING", payload: boolean }
  | { type: "SET_PERFORMANCE", payload: PerformanceRow[] }
  | { type: "SET_VIEW_MODE", payload: ViewMode }
  | { type: "SET_SEARCH_QUERY", payload: string };

/*
  3) Helper function
*/
function fuzzyContains(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}
function transformFilterItem(value: string): string {
  // e.g. "my-tag" => "My Tag"
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

/*
  4) The initial state
*/
const initialFilters: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  years: [],
  types: [],
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
  filterOptions: initialFilterOptions,
  filters: initialFilters,
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
  performance: [],
  viewMode: "desktop",
  searchQuery: "",
};

/*
  5) The reducer
*/
function reducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
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
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_FILTER_OPTIONS_LOADING":
      return { ...state, filterOptionsLoading: action.payload };
    case "SET_PERFORMANCE":
      return { ...state, performance: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

/*
  6) The Stats Component
*/
export default function Stats() {
  const { toast } = useToast();
  const { data: session } = useSession(); // from next-auth
  const [state, dispatch] = React.useReducer(reducer, initialState);

  // We keep local aggregated data for the user’s performance
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [avgReattempt, setAvgReattempt] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalIncorrect, setTotalIncorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Decide initial view mode
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      dispatch({ type: "SET_VIEW_MODE", payload: "mobile" });
    }
  }, []);

  /* 6(A) Fetch filter options once */
  const fetchFilterOptions = React.useCallback(async () => {
    dispatch({ type: "SET_FILTER_OPTIONS_LOADING", payload: true });
    try {
      const res = await fetch("/api/filters", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch distinct filter fields.");

      const raw = await res.json();
      // Expect e.g. raw.exams, raw.subjects, etc.
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
    } finally {
      dispatch({ type: "SET_FILTER_OPTIONS_LOADING", payload: false });
    }
  }, [toast]);

  // For the performance route, we pass filter queries
  const fetchUserPerformance = React.useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // We assume /api/user-performance/get supports the same param logic:
      //   ?exam=JEE,NEET&subject=Physics
      // or you might create a custom route like /api/user-performance/stats
      const arrToComma = (arr: string[]) => arr.join(",");
      const { filters } = state;
      const params = new URLSearchParams();
      if (filters.exams.length) params.set("exam", arrToComma(filters.exams));
      if (filters.subjects.length) params.set("subject", arrToComma(filters.subjects));
      if (filters.topics.length) params.set("topic", arrToComma(filters.topics));
      if (filters.subtopics.length) params.set("subtopic", arrToComma(filters.subtopics));
      if (filters.difficulties.length) params.set("difficulty", arrToComma(filters.difficulties));
      if (filters.years.length) params.set("year", arrToComma(filters.years));
      if (filters.types.length) params.set("type", arrToComma(filters.types));

      const url = `/api/user-performance/get?${params.toString()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch user performance with filters.");

      const perf = await res.json() as PerformanceRow[];
      dispatch({ type: "SET_PERFORMANCE", payload: perf });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not fetch performance data.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.filters, toast]);

  // on mount => fetch filter options
  React.useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // whenever filters change => fetch user performance
  React.useEffect(() => {
    fetchUserPerformance();
  }, [state.filters, fetchUserPerformance]);

  /* 6(B) Aggregate performance data */
  React.useEffect(() => {
    if (!state.performance.length) {
      setAvgAccuracy(0);
      setAvgReattempt(0);
      setTotalCorrect(0);
      setTotalIncorrect(0);
      setTotalAttempts(0);
      return;
    }
    let sumAcc = 0, sumRe = 0;
    let sumCorrect = 0, sumIncorrect = 0, sumAttempts = 0;

    for (const row of state.performance) {
      sumAcc += row.accuracy;
      sumRe += row.reattemptAccuracy;
      sumCorrect += row.correctAnswers;
      sumIncorrect += row.incorrectAnswers;
      sumAttempts += row.questionsAttempted;
    }
    const n = state.performance.length;
    setAvgAccuracy(sumAcc / n);
    setAvgReattempt(sumRe / n);
    setTotalCorrect(sumCorrect);
    setTotalIncorrect(sumIncorrect);
    setTotalAttempts(sumAttempts);
  }, [state.performance]);

  /* 7) Filter popovers logic for desktop */
  function DesktopFilterSearch({
    filterType,
    filterValues,
  }: {
    filterType: FilterKey;
    filterValues: string[];
  }) {
    const [searchTerm, setSearchTerm] = useState("");

    const displayedValues = useMemo(() => {
      let arr = [...filterValues];
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        arr = arr.filter((val) => val.toLowerCase().includes(lower));
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
    }, [filterValues, searchTerm, filterType]);

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
      <>
        <Input
          type="text"
          placeholder={`Search ${filterType}...`}
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

  /* 8) For mobile filter
     basically the same approach as in your question bank
   */
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);

  function MobileFiltersDialog() {
    return (
      <Dialog open={filtersOpenMobile} onOpenChange={setFiltersOpenMobile}>
        <DialogContent
          className="
            fixed top-0 left-0 w-screen h-screen
            sm:w-[500px] sm:max-h-[90vh] sm:left-1/2 sm:top-1/2
            sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            flex flex-col
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
              onClick={() => setFiltersOpenMobile(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
            >
              ✕
            </Button>
          </div>
          <ScrollArea className="px-4 py-4 custom-scrollbar flex-1">
            {/* 
              list the same filters for exams, subjects, etc.
              Let’s do a simpler approach or replicate the question bank
            */}
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              (Replicate your mobile filter UI from QBC)
            </p>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  /* 9) Build chart data from state.performance */
  // Example: daily grouping, or just display them as is
  const [chartData, setChartData] = useState<any[]>([]);
  React.useEffect(() => {
    if (!state.performance.length) {
      setChartData([]);
      return;
    }
    // For example, group by date => or just keep them as an array
    // We'll do a simple approach: "index" => row
    const data = state.performance.map((row, i) => {
      return {
        day: `Day ${i+1}`,
        correct: row.correctAnswers,
        incorrect: row.incorrectAnswers,
        attempts: row.questionsAttempted,
        accuracy: row.accuracy
      };
    });
    setChartData(data);
  }, [state.performance]);

  /* 10) Rendering */

  // If still loading filter options or data => skeleton
  if (state.loading || state.filterOptionsLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        {/* maybe a grid of skeleton cards */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Show "no data" if no performance rows
  if (!state.performance.length) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-300">
        No performance data with these filters. Try adjusting them.
      </div>
    );
  }

  // *** MOBILE vs DESKTOP logic if you want. Let’s keep it simple. ***
  // Title with user name
  const userName = session?.user?.name ?? "Guest";

  return (
    <div className="max-w-6xl mx-auto p-4 text-gray-900 dark:text-gray-100">
      {/* Title with user name in specified font */}
      <h1 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem] mb-6">
        {userName}&apos;s Performance
      </h1>

      {/* Filters row (desktop) */}
      <div className="flex gap-4 items-center mb-6">
        {/* ... search if you want ... */}
        <Button
          variant="outline"
          onClick={() => setFiltersOpenMobile(true)}
          className="sm:hidden flex items-center"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        {/* Desktop filter popovers */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {(Object.keys(state.filterOptions) as FilterKey[]).map((filterType) => {
            const filterValues = state.filterOptions[filterType] ?? [];
            const isOpen = state.dropdowns[filterType];
            return (
              <div key={filterType}>
                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch({ type: "SET_DROPDOWNS", payload: { key: filterType, value: !isOpen }});
                  }}
                >
                  {filterType} ({state.filters[filterType].length} selected)
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                {isOpen && (
                  <div className="absolute bg-white p-2 rounded-md shadow-md dark:bg-gray-800">
                    <DesktopFilterSearch
                      filterType={filterType}
                      filterValues={filterValues}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <MobileFiltersDialog />

      {/* Display aggregated stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* average accuracy */}
        <Card>
          <CardHeader>
            <CardTitle>Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{avgAccuracy.toFixed(2)}%</p>
          </CardContent>
        </Card>

        {/* reattempt */}
        <Card>
          <CardHeader>
            <CardTitle>Reattempt Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{avgReattempt.toFixed(2)}%</p>
          </CardContent>
        </Card>

        {/* total correct */}
        <Card>
          <CardHeader>
            <CardTitle>Total Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalCorrect}</p>
          </CardContent>
        </Card>

        {/* total attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalAttempts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Example chart: correct vs. incorrect */}
      <Card>
        <CardHeader>
          <CardTitle>Attempts Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" fill="#22c55e" stackId="a" name="Correct" />
                <Bar dataKey="incorrect" fill="#ef4444" stackId="a" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
