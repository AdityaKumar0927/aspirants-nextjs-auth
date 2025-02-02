"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------
   1) Types
   ------------------------------------------------------------------ */
interface UserPerformance {
  id: number;
  userId: string;
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAttempted: number;
  accuracy: number;            // e.g. 0..100
  reattemptAccuracy: number;   // e.g. 0..100
  timeSpent: number;           // total seconds or minutes
  createdAt: string; // date
  // ...
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

interface QuestionInfo {
  questionId: string;
  subject?: string;
  difficulty?: string;
  // ...
}

/* ------------------------------------------------------------------
   2) Example Merged Data
   ------------------------------------------------------------------ */
interface DailyStats {
  date: string;    // "YYYY-MM-DD"
  correct: number;
  incorrect: number;
  attempts: number;
  accuracy: number;    // average
  reattempt?: number;  // average reattempt
}

interface Aggregates {
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  avgAccuracy: number;
  avgReattempt: number;
}

/*
  If we want to do subject distribution, we can store:
  { [subject: string]: { correct, incorrect, attempts } }
*/

/* ------------------------------------------------------------------
   3) The Stats component
   ------------------------------------------------------------------ */
export default function ComprehensiveStats() {
  const { toast } = useToast();

  // Data states
  const [userPerf, setUserPerf] = useState<UserPerformance[]>([]);
  const [userProg, setUserProg] = useState<UserProgress[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [questions, setQuestions] = useState<QuestionInfo[]>([]); // optional

  const [loading, setLoading] = useState(true);

  // Aggregated
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);

  // Additional breakdowns
  const [subjectDistribution, setSubjectDistribution] = useState<
    { subject: string; correct: number; incorrect: number; attempts: number }[]
  >([]);

  // Completed vs. reviewed vs. unattempted donut
  const [progressDonutData, setProgressDonutData] = useState<{ name: string; value: number }[]>([]);

  /* ------------------------------------------------------------------
     4) Fetch all data on mount
     ------------------------------------------------------------------ */
  async function fetchData() {
    setLoading(true);
    try {
      // We'll fetch from user-performance, user-progress, user-answers
      // If you want subject distribution, also fetch /api/questions or a custom route
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
        ansRes.json() as Promise<UserAnswer[]>
      ]);

      // If you want to merge question info (subject, difficulty), fetch from /api/questions
      // or a specialized route. For example:
      // const qRes = await fetch("/api/questions?someFilter", { cache: "no-store" });
      // const qData = await qRes.json() as QuestionInfo[];
      // setQuestions(...);

      setUserPerf(perfData);
      setUserProg(progData);
      setUserAnswers(ansData);

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load stats data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  /* ------------------------------------------------------------------
     5) Build daily stats & aggregates from userPerf
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userPerf.length) {
      setDailyStats([]);
      setAggregates(null);
      return;
    }

    // overall sums
    let totalCorrect = 0, totalIncorrect = 0, totalAttempts = 0;
    let sumAcc = 0, sumReattempt = 0;

    // daily grouping
    const dayMap: Record<string, {
      correct: number; incorrect: number; attempts: number;
      sumAccuracy: number; sumReattempt: number; count: number;
    }> = {};

    for (const row of userPerf) {
      totalCorrect += row.correctAnswers;
      totalIncorrect += row.incorrectAnswers;
      totalAttempts += row.questionsAttempted;
      sumAcc += row.accuracy;
      sumReattempt += row.reattemptAccuracy;

      // group by date
      const dayStr = new Date(row.createdAt).toISOString().slice(0, 10);
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = {
          correct: 0, incorrect: 0, attempts: 0,
          sumAccuracy: 0, sumReattempt: 0, count: 0
        };
      }
      const dObj = dayMap[dayStr];
      dObj.correct += row.correctAnswers;
      dObj.incorrect += row.incorrectAnswers;
      dObj.attempts += row.questionsAttempted;
      dObj.sumAccuracy += row.accuracy;
      dObj.sumReattempt += row.reattemptAccuracy;
      dObj.count += 1;
    }

    const newDaily: DailyStats[] = Object.entries(dayMap).map(([date, obj]) => {
      const avgAcc = obj.sumAccuracy / obj.count;
      const avgReatt = obj.sumReattempt / obj.count;
      return {
        date,
        correct: obj.correct,
        incorrect: obj.incorrect,
        attempts: obj.attempts,
        accuracy: Number(avgAcc.toFixed(2)),
        reattempt: Number(avgReatt.toFixed(2))
      };
    });

    // sort chronologically
    newDaily.sort((a, b) => (a.date < b.date ? -1 : 1));

    // overall aggregates
    const len = userPerf.length;
    const avgAccuracy = len ? sumAcc / len : 0;
    const avgReattempt = len ? sumReattempt / len : 0;

    setDailyStats(newDaily);
    setAggregates({
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      avgAccuracy: Number(avgAccuracy.toFixed(2)),
      avgReattempt: Number(avgReattempt.toFixed(2))
    });
  }, [userPerf]);

  /* ------------------------------------------------------------------
     6) Build "Completed vs. Reviewed vs. Not Attempted" donut from userProg
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userProg.length) {
      setProgressDonutData([]);
      return;
    }
    // e.g. completed, reviewed, everything else
    let completedCount = 0, reviewedCount = 0;
    for (const p of userProg) {
      if (p.completed) completedCount++;
      if (p.reviewed) reviewedCount++;
    }
    // If you have total # of questions from userPerf or from question listing
    // or if you want to count "incomplete" vs. "unattempted," you can do so.
    // Suppose we just do total userProgress entries => incomplete is userProg.length - completedCount
    const totalProg = userProg.length;
    const incompleteCount = totalProg - completedCount;

    setProgressDonutData([
      { name: "Completed", value: completedCount },
      { name: "Reviewed", value: reviewedCount },
      { name: "Incomplete", value: incompleteCount }
    ]);
  }, [userProg]);

  /* ------------------------------------------------------------------
     7) Build subject distribution from userAnswers + question list
        This is optional if you want a subject-based chart
     ------------------------------------------------------------------ */
  useEffect(() => {
    // If you want subject distribution, you'd join userAnswers.questionId
    // with questions => subject
    // This requires you to have fetched question data from /api/questions
    if (!questions.length || !userAnswers.length) {
      setSubjectDistribution([]);
      return;
    }

    // e.g. build a map subject => { correct, incorrect, attempts }
    const subMap: Record<string, { correct: number; incorrect: number; attempts: number }> = {};

    // We assume you have a local map questionId => subject
    const qMap: Record<string, string> = {};
    for (const q of questions) {
      if (q.subject) {
        qMap[q.questionId] = q.subject;
      }
    }

    for (const ans of userAnswers) {
      const subject = qMap[ans.questionId] || "Unknown";
      if (!subMap[subject]) {
        subMap[subject] = { correct: 0, incorrect: 0, attempts: 0 };
      }
      subMap[subject].attempts++;
      if (ans.isCorrect) {
        subMap[subject].correct++;
      } else {
        subMap[subject].incorrect++;
      }
    }

    const distr = Object.entries(subMap).map(([subject, obj]) => ({
      subject,
      correct: obj.correct,
      incorrect: obj.incorrect,
      attempts: obj.attempts
    }));
    setSubjectDistribution(distr);
  }, [questions, userAnswers]);

  /* ------------------------------------------------------------------
     8) Render
     ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full" />
        ))}
      </div>
    );
  }

  if (!aggregates) {
    return <p className="text-gray-500 dark:text-gray-300">No stats data yet.</p>;
  }

  // Build data for daily line chart
  const dailyLineData = dailyStats.map(d => ({
    ...d,
    dayLabel: d.date.slice(5) // "MM-DD" for x-axis
  }));

  // Build data for correct vs. incorrect stacked bar
  // Could reuse dailyLineData with keys: correct, incorrect

  // For donut
  const donutColors = ["#22c55e", "#facc15", "#ef4444"];

  // For subject distribution (Pie or bar). Let’s do a simple bar
  // Or a pie for each subject
  // For each subject, sum correct vs. incorrect => we might do a Pie if we want total attempts
  // e.g. { name: subject, value: attempts }
  const subjectPieData = subjectDistribution.map(obj => ({
    name: obj.subject,
    value: obj.attempts
  }));
  const subjectColors = ["#8b5cf6", "#3b82f6", "#10b981", "#14b8a6", "#f43f5e"];

  return (
    <div className="space-y-4">
      {/* 1) Grid of main aggregates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Avg Accuracy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {aggregates.avgAccuracy.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">+2% from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyLineData}>
                  <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Attempts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregates.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyLineData}>
                  <Bar dataKey="attempts" fill="#2563eb" radius={[4,4,0,0]} />
                  <Tooltip />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Correct */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregates.totalCorrect}</div>
            <p className="text-xs text-muted-foreground">+7 from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyLineData}>
                  <Line type="monotone" dataKey="correct" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reattempt Accuracy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reattempt Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregates.avgReattempt.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">+1.2% from last week</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyLineData}>
                  <Line type="monotone" dataKey="reattempt" stroke="#fb923c" strokeWidth={2} dot={false} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2) Correct vs. Incorrect Over Time (stacked bar) */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Correct vs. Incorrect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyLineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" stackId="a" fill="#22c55e" name="Correct" />
                <Bar dataKey="incorrect" stackId="a" fill="#ef4444" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3) Completed vs. Reviewed vs. Incomplete (Pie/Donut) */}
      <Card>
        <CardHeader>
          <CardTitle>Progress: Completed vs. Reviewed vs. Incomplete</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressDonut userProg={userProg} />
        </CardContent>
      </Card>

      {/* 4) Overall Correct vs. Incorrect Pie */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Correct vs. Incorrect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <OverallCorrectPie
              totalCorrect={aggregates.totalCorrect}
              totalIncorrect={aggregates.totalIncorrect}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5) Subject Distribution (optional) */}
      {subjectDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution (by Attempts)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <SubjectDistributionPie distribution={subjectDistribution} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   9) Additional sub-components
   ------------------------------------------------------------------ */

/* Donut for completed vs. reviewed vs. incomplete */
function ProgressDonut({ userProg }: { userProg: UserProgress[] }) {
  // We'll build the data here or do it outside
  // For demonstration, let’s do it directly
  const total = userProg.length;
  let completedCount = 0, reviewedCount = 0;
  for (const p of userProg) {
    if (p.completed) completedCount++;
    if (p.reviewed) reviewedCount++;
  }
  const incompleteCount = total - completedCount;

  const donutData = [
    { name: "Completed", value: completedCount },
    { name: "Reviewed", value: reviewedCount },
    { name: "Incomplete", value: incompleteCount },
  ];
  const colors = ["#22c55e", "#facc15", "#ef4444"];

  return (
    <div className="h-64">
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
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Overall Correct vs. Incorrect Pie */
function OverallCorrectPie({
  totalCorrect,
  totalIncorrect
}: {
  totalCorrect: number;
  totalIncorrect: number;
}) {
  const data = [
    { name: "Correct", value: totalCorrect },
    { name: "Incorrect", value: totalIncorrect },
  ];
  const colors = ["#16a34a", "#dc2626"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* Subject Distribution (Pie). Each slice = subject => total attempts */
interface SubjectData {
  subject: string;
  correct: number;
  incorrect: number;
  attempts: number;
}
function SubjectDistributionPie({ distribution }: { distribution: SubjectData[] }) {
  const data = distribution.map((d) => ({
    name: d.subject,
    value: d.attempts
  }));

  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#14b8a6", "#fb923c", "#ef4444", "#eab308"];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
          {data.map((entry, idx) => (
            <Cell key={entry.name} fill={colors[idx % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
