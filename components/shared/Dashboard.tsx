// Dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";

interface UserPerformance {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  accuracy: number;
  weaknessBySubtopic: any;
  improvementOverTime: any;
  attemptRate: number;
  firstAttemptSuccessRate: number;
  reattemptAccuracy: number;
  topicPerformance: any;
  consistency: number;
  engagementLevel: number;
  completed: boolean;
  reviewed: boolean;
}

const fetchUserPerformance = async (userId: string): Promise<UserPerformance[]> => {
  const response = await fetch(`/api/user-performance/get?userId=${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user performance");
  }
  return response.json();
};

const Dashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchUserPerformance(userId);
        setUserPerformance(data);
      } catch (error) {
        console.error("Error fetching user performance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
        <Skeleton height={300} width="100%" />
      </div>
    );
  }

  const latestPerformance = userPerformance.length > 0 ? userPerformance[0] : {
    accuracy: 0,
    questionsAttempted: 0,
    firstAttemptSuccessRate: 0,
  };

  return (
    <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
        <Card className="lg:max-w-md">
          <CardHeader className="space-y-0 pb-2">
            <CardDescription>Accuracy</CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              {latestPerformance.accuracy}{' '}
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                %
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                accuracy: {
                  label: 'Accuracy',
                  color: 'hsl(var(--chart-1))',
                },
              }}
            >
              <BarChart
                accessibilityLayer
                margin={{ left: -4, right: -4 }}
                data={userPerformance}
              >
                <Bar
                  dataKey="accuracy"
                  fill="var(--color-accuracy)"
                  radius={5}
                  fillOpacity={0.6}
                  activeBar={<Rectangle fillOpacity={0.8} />}
                />
                <XAxis
                  dataKey="questionId"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                  cursor={false}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1">
            <CardDescription>
              Over the past 7 days, your accuracy has been{' '}
              <span className="font-medium text-foreground">75%</span>.
            </CardDescription>
            <CardDescription>
              You need{' '}
              <span className="font-medium text-foreground">80%</span> accuracy
              to reach your goal.
            </CardDescription>
          </CardFooter>
        </Card>
        <Card className="flex flex-col lg:max-w-md">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 [&>div]:flex-1">
            <div>
              <CardDescription>Questions Attempted</CardDescription>
              <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
                {latestPerformance.questionsAttempted}
                <span className="text-sm font-normal tracking-normal text-muted-foreground">
                  questions
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center">
            <ChartContainer
              config={{
                questionsAttempted: {
                  label: 'Questions Attempted',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="w-full"
            >
              <LineChart
                accessibilityLayer
                margin={{ left: 14, right: 14, top: 10 }}
                data={userPerformance}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.5}
                />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <XAxis
                  dataKey="questionId"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })
                  }
                />
                <Line
                  dataKey="questionsAttempted"
                  type="natural"
                  fill="var(--color-questionsAttempted)"
                  stroke="var(--color-questionsAttempted)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    fill: 'var(--color-questionsAttempted)',
                    stroke: 'var(--color-questionsAttempted)',
                    r: 4,
                  }}
                />
                <Tooltip />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full flex-1 gap-6 lg:max-w-[20rem]">
        <Card className="max-w-xs">
          <CardHeader>
            <CardTitle>First Attempt Success Rate</CardTitle>
            <CardDescription>
              How often you get the right answer on the first try.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid auto-rows-min gap-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                {latestPerformance.firstAttemptSuccessRate}%
                <span className="text-sm font-normal text-muted-foreground">
                  success rate
                </span>
              </div>
              <ChartContainer
                config={{
                  firstAttemptSuccessRate: {
                    label: 'First Attempt Success Rate',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  data={[{ date: '2024', firstAttemptSuccessRate: latestPerformance.firstAttemptSuccessRate }]}
                >
                  <Bar
                    dataKey="firstAttemptSuccessRate"
                    fill="var(--color-firstAttemptSuccessRate)"
                    radius={4}
                    barSize={32}
                  >
                    <LabelList
                      position="insideLeft"
                      dataKey="date"
                      offset={8}
                      fontSize={12}
                      fill="white"
                    />
                  </Bar>
                  <YAxis dataKey="date" type="category" tickCount={1} hide />
                  <XAxis dataKey="firstAttemptSuccessRate" type="number" hide />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
