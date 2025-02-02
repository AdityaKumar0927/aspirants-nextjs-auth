"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

/* ------------------------------------------------------------------
   1) Type definitions 
   ------------------------------------------------------------------ */
interface UserPerformance {
  questionId: string;
  userId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAttempted: number;
  accuracy: number;          // e.g. 0..100
  reattemptAccuracy: number; // e.g. 0..100
  createdAt: string;         // date time
  // ... additional fields if any
}

interface UserProgress {
  id: string;
  userId: string;
  questionId: string;
  completed: boolean;
  reviewed: boolean;
  lastAttempted: string | null;
}

interface UserAnswer {
  id: string;
  userId: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

/* 
   We'll define aggregator data for each:
   - userPerformance => daily stats or total stats
   - userProgress => completed vs. reviewed
   - userAnswers => total correct vs. incorrect
*/

/* ------------------------------------------------------------------
   2) The Stats component 
   ------------------------------------------------------------------ */
export default function Stats() {
  const { data: session } = useSession(); // MUST have <SessionProvider> in the app
  const { toast } = useToast();

  // Local states
  const [loading, setLoading] = useState(true);

  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  // Aggregates
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [avgReattempt, setAvgReattempt] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const [progressCounts, setProgressCounts] = useState({
    total: 0,
    completed: 0,
    reviewed: 0,
    incomplete: 0,
  });

  const [answersCounts, setAnswersCounts] = useState({
    totalCorrect: 0,
    totalIncorrect: 0,
  });

  // For a daily line chart from userPerformance
  const [dailyPerf, setDailyPerf] = useState<{ date: string; accuracy: number; attempts: number }[]>([]);

  // For user name
  const userName = session?.user?.name || "Guest";

  /* ------------------------------------------------------------------
     3) Fetch all data in parallel 
     ------------------------------------------------------------------ */
  async function fetchAllData() {
    setLoading(true);
    try {
      // Do 3 parallel requests
      const [perfRes, progRes, ansRes] = await Promise.all([
        fetch("/api/user-performance/get", { cache: "no-store" }),
        fetch("/api/user-progress", { cache: "no-store" }),
        fetch("/api/user-answers", { cache: "no-store" }),
      ]);

      if (!perfRes.ok) {
        throw new Error("Failed to fetch userPerformance");
      }
      if (!progRes.ok) {
        throw new Error("Failed to fetch userProgress");
      }
      if (!ansRes.ok) {
        throw new Error("Failed to fetch userAnswers");
      }

      const [perfData, progData, ansData] = await Promise.all([
        perfRes.json() as Promise<UserPerformance[]>,
        progRes.json() as Promise<UserProgress[]>,
        ansRes.json() as Promise<UserAnswer[]>,
      ]);

      setUserPerformance(perfData);
      setUserProgress(progData);
      setUserAnswers(ansData);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast({
        title: "Error",
        description: "Failed to load stats data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // On mount => fetchAllData
  useEffect(() => {
    fetchAllData();
  }, []);

  /* ------------------------------------------------------------------
     4) Build aggregator for userPerformance 
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userPerformance.length) {
      setAvgAccuracy(0);
      setAvgReattempt(0);
      setTotalAttempts(0);
      setDailyPerf([]);
      return;
    }

    let sumAcc = 0, sumRe = 0, sumAttempts = 0;
    // We'll also do a daily grouping
    const dayMap: Record<string, { sumAcc: number; count: number; attempts: number }> = {};

    userPerformance.forEach((row) => {
      sumAcc += row.accuracy;
      sumRe += row.reattemptAccuracy;
      sumAttempts += row.questionsAttempted;

      // Group by date for daily chart
      const dayStr = new Date(row.createdAt).toISOString().slice(0, 10);
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = { sumAcc: 0, count: 0, attempts: 0 };
      }
      dayMap[dayStr].sumAcc += row.accuracy;
      dayMap[dayStr].count += 1;
      dayMap[dayStr].attempts += row.questionsAttempted;
    });

    const n = userPerformance.length;
    setAvgAccuracy(n ? sumAcc / n : 0);
    setAvgReattempt(n ? sumRe / n : 0);
    setTotalAttempts(sumAttempts);

    // Build daily array
    const dailyArr = Object.entries(dayMap).map(([date, obj]) => {
      const avgDayAcc = obj.count > 0 ? obj.sumAcc / obj.count : 0;
      return {
        date,
        accuracy: Number(avgDayAcc.toFixed(2)),
        attempts: obj.attempts,
      };
    });
    // sort by date
    dailyArr.sort((a,b) => (a.date < b.date ? -1 : 1));
    setDailyPerf(dailyArr);
  }, [userPerformance]);

  /* ------------------------------------------------------------------
     5) Build aggregator from userProgress 
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userProgress.length) {
      setProgressCounts({
        total: 0,
        completed: 0,
        reviewed: 0,
        incomplete: 0,
      });
      return;
    }
    const total = userProgress.length;
    let comp = 0, rev = 0;
    userProgress.forEach((p) => {
      if (p.completed) comp++;
      if (p.reviewed) rev++;
    });
    const incomplete = total - comp;
    setProgressCounts({
      total,
      completed: comp,
      reviewed: rev,
      incomplete,
    });
  }, [userProgress]);

  /* ------------------------------------------------------------------
     6) Build aggregator from userAnswers => correct vs. incorrect 
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userAnswers.length) {
      setAnswersCounts({
        totalCorrect: 0,
        totalIncorrect: 0,
      });
      return;
    }
    let corr = 0, incorr = 0;
    userAnswers.forEach((a) => {
      if (a.isCorrect) corr++;
      else incorr++;
    });
    setAnswersCounts({
      totalCorrect: corr,
      totalIncorrect: incorr,
    });
  }, [userAnswers]);

  /* ------------------------------------------------------------------
     7) Loading skeleton if needed
     ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------
     8) Main Render 
     ------------------------------------------------------------------ */
  const totalQuestions = progressCounts.total;
  const totalCorrect = answersCounts.totalCorrect;
  const totalIncorrect = answersCounts.totalIncorrect;
  const totalComp = progressCounts.completed;
  const totalRev = progressCounts.reviewed;
  const totalIncomp = progressCounts.incomplete;

  // We'll do a donut for completed vs reviewed vs incomplete
  const donutData = [
    { name: "Completed", value: totalComp },
    { name: "Reviewed", value: totalRev },
    { name: "Incomplete", value: totalIncomp },
  ];
  const donutColors = ["#22c55e", "#facc15", "#ef4444"];

  // We'll do a Pie for correct vs incorrect
  const pieData = [
    { name: "Correct", value: totalCorrect },
    { name: "Incorrect", value: totalIncorrect },
  ];
  const pieColors = ["#16a34a", "#dc2626"];

  return (
    <div className="max-w-6xl mx-auto p-4 text-gray-900 dark:text-gray-100">
      {/* Title with user name from session */}
      <h1 className="font-display text-2xl tracking-[-0.02em] drop-shadow-sm sm:text-3xl sm:leading-[4rem] mb-6">
        {session?.user?.name || "Guest"}&apos;s Comprehensive Statistics
      </h1>

      {/* Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* total attempts from userPerformance */}
        <Card>
          <CardHeader>
            <CardTitle>Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalAttempts}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              across all questions
            </p>
          </CardContent>
        </Card>

        {/* average accuracy from userPerformance */}
        <Card>
          <CardHeader>
            <CardTitle>Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{avgAccuracy.toFixed(2)}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              average correct ratio
            </p>
          </CardContent>
        </Card>

        {/* completed from userProgress */}
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalComp}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              out of {totalQuestions} total
            </p>
          </CardContent>
        </Card>

        {/* correct from userAnswers */}
        <Card>
          <CardHeader>
            <CardTitle>Total Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalCorrect}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              vs. {totalIncorrect} incorrect
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row(s) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LineChart for daily accuracy from userPerformance */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Daily Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyPerf.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyPerf}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} name="Accuracy (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500">No daily performance data.</p>
            )}
          </CardContent>
        </Card>

        {/* Donut for userProgress (completed vs reviewed vs incomplete) */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Progress Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    label
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Pie for correct vs. incorrect (userAnswers) */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Correct vs. Incorrect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Additional bar chart example for daily attempts from userPerformance? */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Daily Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyPerf.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyPerf}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attempts" fill="#6366f1" name="Attempts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500">No daily attempts data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
