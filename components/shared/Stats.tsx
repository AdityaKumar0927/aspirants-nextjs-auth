"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------
   Types
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
  accuracy: number;            // e.g. 0..100
  reattemptAccuracy: number;   // e.g. 0..100
  createdAt: string;           // date string
  updatedAt: string;
  // more fields...
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
  // Example aggregates
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  avgAccuracy: number;
  avgReattemptAccuracy: number;
}

interface StatsRow {
  // For line/bar charts by day or question
  date: string; // or questionId if you prefer
  correct: number;
  incorrect: number;
  attempted: number;
  accuracy: number;
}

/* ------------------------------------------------------
   Stats Component
   ------------------------------------------------------ */
export default function Stats() {
  const { toast } = useToast();

  // Local states
  const [perfData, setPerfData] = useState<UserPerformance[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Example: combined aggregates
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);

  /* ------------------------------
     1) Fetch userPerformance
     ------------------------------ */
  async function fetchUserPerformance() {
    try {
      const res = await fetch("/api/user-performance/get", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error fetching userPerformance. Status: ${res.status}`);
      }
      const data: UserPerformance[] = await res.json();
      setPerfData(data);
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
     2) Fetch userAnswers
     ------------------------------ */
  async function fetchUserAnswers() {
    try {
      const res = await fetch("/api/user-answers", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error fetching userAnswers. Status: ${res.status}`);
      }
      const data: UserAnswer[] = await res.json();
      setAnswers(data);
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
     3) Fetch userProgress
     ------------------------------ */
  async function fetchUserProgress() {
    try {
      const res = await fetch("/api/user-progress", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Error fetching userProgress. Status: ${res.status}`);
      }
      const data: UserProgress[] = await res.json();
      setProgress(data);
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
     4) On mount => fetch all data
     ------------------------------ */
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchUserPerformance(), fetchUserAnswers(), fetchUserProgress()]);
      setLoading(false);
    })();
  }, []);

  /* ------------------------------
     5) Derive Aggregates
     ------------------------------ */
  useEffect(() => {
    if (!perfData.length) {
      setAggregate(null);
      return;
    }
    // Example: total correct across entire dataset
    const totalCorrect = perfData.reduce((sum, row) => sum + row.correctAnswers, 0);
    const totalIncorrect = perfData.reduce((sum, row) => sum + row.incorrectAnswers, 0);
    const totalAttempts = perfData.reduce((sum, row) => sum + row.questionsAttempted, 0);

    // average accuracy
    const avgAccuracy = perfData.reduce((acc, row) => acc + row.accuracy, 0) / perfData.length;
    const avgReattempt = perfData.reduce((acc, row) => acc + row.reattemptAccuracy, 0) / perfData.length;

    setAggregate({
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      avgAccuracy,
      avgReattemptAccuracy: avgReattempt,
    });
  }, [perfData]);

  /* ------------------------------
     6) Build chart data
     ------------------------------ */
  // For example, a day-by-day or questionId-based chart
  const lineChartData = perfData.map((p) => {
    return {
      date: new Date(p.createdAt).toLocaleDateString(), // or p.questionId, etc.
      correct: p.correctAnswers,
      incorrect: p.incorrectAnswers,
      attempted: p.questionsAttempted,
      accuracy: p.accuracy,
    };
  });

  // For a subject distribution or similar, you might fetch question subject from "userAnswers => question => subject"
  // We won't do that here unless you have an easy way to join question data. Just an example:
  // const subjectDistribution = ... ?

  /* ------------------------------
     7) Render
     ------------------------------ */
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full" />
        ))}
      </div>
    );
  }

  if (!aggregate) {
    // If perfData is empty, we say "No data"
    return (
      <div className="text-gray-500 dark:text-gray-300">
        No performance data yet. Try answering some questions!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid of overall stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregate.avgAccuracy.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">+2.5% from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregate.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lineChartData}>
                  <Bar dataKey="attempted" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Tooltip />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregate.totalCorrect}</div>
            <p className="text-xs text-muted-foreground">+7 from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <Line type="monotone" dataKey="correct" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reattempt Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregate.avgReattemptAccuracy.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">+1.2% from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <Line type="monotone" dataKey="reattemptAccuracy" stroke="#ea580c" strokeWidth={2} dot={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Example additional chart(s): correct vs. incorrect across time */}
      <Card>
        <CardHeader>
          <CardTitle>Correct vs. Incorrect Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" fill="#22c55e" name="Correct" />
                <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Possibly a Pie chart for distribution of attempts or something */}
      <Card>
        <CardHeader>
          <CardTitle>Correct vs. Incorrect Pie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Correct", value: aggregate.totalCorrect },
                    { name: "Incorrect", value: aggregate.totalIncorrect },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
