"use client";

import React, { useEffect, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"; // shadcn chart

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

/* ------------------------------------------------------
   1) Types
   ------------------------------------------------------ */
interface UserPerformance {
  id: number;
  userId: string;
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  accuracy: number; // e.g. 0..100
  reattemptAccuracy: number; // e.g. 0..100
  createdAt: string; // date string
  updatedAt: string;
  // ...
}

interface UserAnswer {
  id: string;
  questionId: string;
  userId: string;
  selectedOption: string;
  isCorrect: boolean;
  // ...
}

interface UserProgress {
  id: string;
  userId: string;
  questionId: string;
  completed: boolean;
  reviewed: boolean;
  lastAttempted: string | null;
  // ...
}

interface AggregateData {
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  avgAccuracy: number;
  avgReattemptAccuracy: number;
}

/* ------------------------------------------------------
   2) Stats component
   ------------------------------------------------------ */
export default function Stats() {
  const { toast } = useToast();

  // Local states
  const [perfData, setPerfData] = useState<UserPerformance[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);

  /* ------------------------------
     A) Fetch userPerformance
     ------------------------------ */
  async function fetchUserPerformance() {
    try {
      const res = await fetch("/api/user-performance/get", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error fetching userPerformance. Status: ${res.status}`);
      }
      const data = await res.json();
      setPerfData(data as UserPerformance[]);
    } catch (err) {
      console.error("fetchUserPerformance error:", err);
      toast({
        title: "Error",
        description: "Could not load performance data",
        variant: "destructive",
      });
    }
  }

  /* ------------------------------
     B) Fetch userAnswers
     ------------------------------ */
  async function fetchUserAnswers() {
    try {
      const res = await fetch("/api/user-answers", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error fetching userAnswers. Status: ${res.status}`);
      }
      const data = await res.json();
      setAnswers(data as UserAnswer[]);
    } catch (err) {
      console.error("fetchUserAnswers error:", err);
      toast({
        title: "Error",
        description: "Could not load user answers",
        variant: "destructive",
      });
    }
  }

  /* ------------------------------
     C) Fetch userProgress
     ------------------------------ */
  async function fetchUserProgress() {
    try {
      const res = await fetch("/api/user-progress", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error fetching userProgress. Status: ${res.status}`);
      }
      const data = await res.json();
      setProgress(data as UserProgress[]);
    } catch (err) {
      console.error("fetchUserProgress error:", err);
      toast({
        title: "Error",
        description: "Could not load progress data",
        variant: "destructive",
      });
    }
  }

  /* ------------------------------
     D) On mount => fetch all data
     ------------------------------ */
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchUserPerformance(), fetchUserAnswers(), fetchUserProgress()]);
      setLoading(false);
    })();
  }, []);

  /* ------------------------------
     E) Derive Aggregates
     ------------------------------ */
  useEffect(() => {
    if (!perfData.length) {
      setAggregate(null);
      return;
    }

    const totalCorrect = perfData.reduce((sum, row) => sum + row.correctAnswers, 0);
    const totalIncorrect = perfData.reduce((sum, row) => sum + row.incorrectAnswers, 0);
    const totalAttempts = perfData.reduce((sum, row) => sum + row.questionsAttempted, 0);
    const avgAccuracy =
      perfData.reduce((acc, row) => acc + row.accuracy, 0) / perfData.length;
    const avgReattempt =
      perfData.reduce((acc, row) => acc + row.reattemptAccuracy, 0) / perfData.length;

    setAggregate({
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      avgAccuracy,
      avgReattemptAccuracy: avgReattempt,
    });
  }, [perfData]);

  /* ------------------------------
     F) Build Chart Data
     ------------------------------ */
  // Example line chart data
  const lineChartData = perfData.map((p) => {
    return {
      // e.g. "2023-08-12"
      date: new Date(p.createdAt).toLocaleDateString(),
      correct: p.correctAnswers,
      incorrect: p.incorrectAnswers,
      attempted: p.questionsAttempted,
      accuracy: p.accuracy,
    };
  });

  // 1) Chart config (for shadcn chart)
  // Maps data keys -> label + color
  const chartConfig = {
    correct: {
      label: "Correct",
      color: "hsl(var(--chart-1))", // or #22c55e
    },
    incorrect: {
      label: "Incorrect",
      color: "hsl(var(--chart-2))", // or #ef4444
    },
    attempted: {
      label: "Attempted",
      color: "hsl(var(--chart-3))",
    },
    accuracy: {
      label: "Accuracy",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  /* ------------------------------
     G) Rendering
     ------------------------------ */
  if (loading) {
    return (
      <SkeletonTheme baseColor="#F3F4F6" highlightColor="#E5E7EB">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
        </div>
      </SkeletonTheme>
    );
  }

  if (!aggregate) {
    // If no performance data
    return <p className="text-sm text-gray-500 dark:text-gray-300">No performance data yet.</p>;
  }

  return (
    <div className="space-y-6">
      {/* 1) Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {aggregate.avgAccuracy.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">+2.5% from last week</p>
            {/* A small line chart for accuracy */}
            <ChartContainer config={chartConfig} className="min-h-[80px] w-full mt-2">
              <LineChart data={lineChartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--color-accuracy)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregate.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
            {/* A small bar chart for attempted */}
            <ChartContainer config={chartConfig} className="min-h-[80px] w-full mt-2">
              <BarChart data={lineChartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Bar
                  dataKey="attempted"
                  fill="var(--color-attempted)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregate.totalCorrect}</div>
            <p className="text-xs text-muted-foreground">+7 from last week</p>
            <ChartContainer config={chartConfig} className="min-h-[80px] w-full mt-2">
              <LineChart data={lineChartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="correct"
                  stroke="var(--color-correct)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Reattempt Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {aggregate.avgReattemptAccuracy.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">+1.2% from last week</p>
            <ChartContainer config={chartConfig} className="min-h-[80px] w-full mt-2">
              <LineChart data={lineChartData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="reattemptAccuracy"
                  stroke="var(--color-accuracy)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 2) Bar chart of correct vs. incorrect */}
      <Card>
        <CardHeader>
          <CardTitle>Correct vs. Incorrect Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart data={lineChartData} accessibilityLayer>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="correct" fill="var(--color-correct)" radius={4} />
              <Bar dataKey="incorrect" fill="var(--color-incorrect)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 3) Another line chart for accuracy */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <LineChart data={lineChartData} accessibilityLayer>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--color-accuracy)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
