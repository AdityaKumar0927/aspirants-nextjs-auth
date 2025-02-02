"use client";

import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useToast } from "@/components/ui/use-toast";

/* ------------------------------------------------------------------
   1) Define your data interfaces (e.g. from your DB tables)
   ------------------------------------------------------------------ */
interface UserPerformance {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  createdAt: string;  // e.g. "2023-08-16T12:00:00Z"
  // more fields like accuracy, timeSpent, etc. if needed
}

interface UserAnswer {
  questionId: string;
  userId: string;
  selectedOption: string;
  isCorrect: boolean;
  createdAt?: string;
  // ...
}

interface UserProgress {
  questionId: string;
  userId: string;
  completed: boolean;
  reviewed: boolean;
  lastAttempted?: string;
  // ...
}

/* ------------------------------------------------------------------
   2) A “Stats” aggregator type: e.g. total correct, attempts, etc.
   ------------------------------------------------------------------ */
interface Aggregates {
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  // Add anything else you want to display
}

/* ------------------------------------------------------------------
   3) The main Stats component
   ------------------------------------------------------------------ */
export default function Stats() {
  const { toast } = useToast();

  // For loading state
  const [loading, setLoading] = useState(true);
  // For storing fetched data
  const [performance, setPerformance] = useState<UserPerformance[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  // For computed aggregates
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);

  /* ------------------------------------------------------------------
     A) Fetch user performance
     ------------------------------------------------------------------ */
  async function fetchUserPerformance() {
    const res = await fetch("/api/user-performance/get", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Error fetching userPerformance: ${res.status}`);
    }
    return (await res.json()) as UserPerformance[];
  }

  /* ------------------------------------------------------------------
     B) Fetch user answers
     ------------------------------------------------------------------ */
  async function fetchUserAnswers() {
    const res = await fetch("/api/user-answers", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Error fetching userAnswers: ${res.status}`);
    }
    return (await res.json()) as UserAnswer[];
  }

  /* ------------------------------------------------------------------
     C) Fetch user progress
     ------------------------------------------------------------------ */
  async function fetchUserProgress() {
    const res = await fetch("/api/user-progress", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Error fetching userProgress: ${res.status}`);
    }
    return (await res.json()) as UserProgress[];
  }

  /* ------------------------------------------------------------------
     D) Load data on mount, handle concurrency
     ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // concurrency fetch
        const [perf, ans, prog] = await Promise.all([
          fetchUserPerformance(),
          fetchUserAnswers(),
          fetchUserProgress(),
        ]);
        setPerformance(perf);
        setAnswers(ans);
        setProgress(prog);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Could not load stats data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  /* ------------------------------------------------------------------
     E) Compute aggregates after data is loaded
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!performance.length) {
      setAggregates(null);
      return;
    }
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalAttempts = 0;

    for (const p of performance) {
      totalCorrect += p.correctAnswers;
      totalIncorrect += p.incorrectAnswers;
      // If you have a “questionsAttempted” field, or compute yourself
      totalAttempts += p.correctAnswers + p.incorrectAnswers;
    }
    setAggregates({
      totalAttempts,
      totalCorrect,
      totalIncorrect,
    });
  }, [performance]);

  /* ------------------------------------------------------------------
     F) Build chart data you want to show. For example:
     ------------------------------------------------------------------ */
  // 1) For an area chart, we can group userPerformance by month => “desktop” vs “mobile”
  // But we'll just do a static sample here. Replace with real aggregator logic.
  const areaChartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
  ];
  // Similarly for bar/line/pie

  /* Chart config objects to define color + labels */
  const areaChartConfig = {
    desktop: {
      label: "Desktop",
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: "Mobile",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const barChartData = areaChartData; // reuse
  const barChartConfig = { ...areaChartConfig };
  const lineChartData = areaChartData; // reuse
  const lineChartConfig = { ...areaChartConfig };

  const pieChartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 190, fill: "var(--color-other)" },
  ];
  const pieChartConfig = {
    visitors: {
      label: "Visitors",
    },
    chrome: {
      label: "Chrome",
      color: "hsl(var(--chart-1))",
    },
    safari: {
      label: "Safari",
      color: "hsl(var(--chart-2))",
    },
    firefox: {
      label: "Firefox",
      color: "hsl(var(--chart-3))",
    },
    edge: {
      label: "Edge",
      color: "hsl(var(--chart-4))",
    },
    other: {
      label: "Other",
      color: "hsl(var(--chart-5))",
    },
  } satisfies ChartConfig;

  const totalVisitors = useMemo(
    () => pieChartData.reduce((acc, curr) => acc + curr.visitors, 0),
    []
  );

  /* ------------------------------------------------------------------
     G) Render
     ------------------------------------------------------------------ */
  if (loading) {
    /* Show skeleton while loading data */
    return (
      <SkeletonTheme baseColor="#F3F4F6" highlightColor="#E5E7EB">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </SkeletonTheme>
    );
  }

  if (!aggregates) {
    // If no data
    return (
      <p className="text-sm text-gray-500 dark:text-gray-300">
        No performance data yet. Try answering some questions!
      </p>
    );
  }

  /* We have data, so let's show the 4 chart cards. They match your UI exactly. */
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* -------------- 1) Area Chart (Stacked) -------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Area Chart - Stacked</CardTitle>
          <CardDescription>
            Showing total visitors for the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig}>
            <AreaChart
              accessibilityLayer
              data={areaChartData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="var(--color-mobile)"
                fillOpacity={0.4}
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="var(--color-desktop)"
                fillOpacity={0.4}
                stroke="var(--color-desktop)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                January - June 2024
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* -------------- 2) Bar Chart (Stacked + Legend) -------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Bar Chart - Stacked + Legend</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig}>
            <BarChart accessibilityLayer data={barChartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="desktop"
                stackId="a"
                fill="var(--color-desktop)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="mobile"
                stackId="a"
                fill="var(--color-mobile)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>

      {/* -------------- 3) Line Chart (Multiple) -------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Line Chart - Multiple</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig}>
            <LineChart
              accessibilityLayer
              data={areaChartData} // or lineChartData
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="desktop"
                type="monotone"
                stroke="var(--color-desktop)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="mobile"
                type="monotone"
                stroke="var(--color-mobile)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                Showing total visitors for the last 6 months
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* -------------- 4) Pie Chart (Donut with text) -------------- */}
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Pie Chart - Donut with Text</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={pieChartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={pieChartData}
                dataKey="visitors"
                nameKey="browser"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    const totalStr = totalVisitors.toLocaleString();
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalStr}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Visitors
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
