"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Label,
  LabelList,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@mui/material";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
        <Skeleton variant="rectangular" width="100%" height={400} />
        <Skeleton variant="rectangular" width="100%" height={400} />
      </div>
    );
  }

  const latestPerformance = userPerformance.length > 0 ? userPerformance[0] : {
    accuracy: 0,
    timeSpent: 0,
    consistency: 0,
  };

  return (
    <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
        <Card className="lg:max-w-md">
          <CardHeader className="space-y-0 pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              {latestPerformance.accuracy}{' '}
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                accuracy
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
                <Tooltip />
                <ReferenceLine
                  y={75}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                >
                  <Label
                    position="insideBottomLeft"
                    value="Average Accuracy"
                    offset={10}
                    fill="hsl(var(--foreground))"
                  />
                  <Label
                    position="insideTopLeft"
                    value="75%"
                    className="text-lg"
                    fill="hsl(var(--foreground))"
                    offset={10}
                    startOffset={100}
                  />
                </ReferenceLine>
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
              <CardDescription>Consistency</CardDescription>
              <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
                {latestPerformance.consistency}%
                <span className="text-sm font-normal tracking-normal text-muted-foreground">
                  consistent
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center">
            <ChartContainer
              config={{
                consistency: {
                  label: 'Consistency',
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
                  dataKey="consistency"
                  type="natural"
                  fill="var(--color-consistency)"
                  stroke="var(--color-consistency)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    fill: 'var(--color-consistency)',
                    stroke: 'var(--color-consistency)',
                    r: 4,
                  }}
                />
                <Tooltip />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:max-w-md">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              You&apos;re averaging better accuracy this year compared to last year.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid auto-rows-min gap-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                {latestPerformance.accuracy}%
                <span className="text-sm font-normal text-muted-foreground">
                  accuracy/day
                </span>
              </div>
              <ChartContainer
                config={{
                  accuracy: {
                    label: 'Accuracy',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  data={[{ date: '2024', accuracy: latestPerformance.accuracy }]}
                >
                  <Bar
                    dataKey="accuracy"
                    fill="var(--color-accuracy)"
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
                  <XAxis dataKey="accuracy" type="number" hide />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="grid auto-rows-min gap-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                {latestPerformance.accuracy}%
                <span className="text-sm font-normal text-muted-foreground">
                  accuracy/day
                </span>
              </div>
              <ChartContainer
                config={{
                  accuracy: {
                    label: 'Accuracy',
                    color: 'hsl(var(--muted))',
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  data={[{ date: '2023', accuracy: latestPerformance.accuracy }]}
                >
                  <Bar
                    dataKey="accuracy"
                    fill="var(--color-accuracy)"
                    radius={4}
                    barSize={32}
                  >
                    <LabelList
                      position="insideLeft"
                      dataKey="date"
                      offset={8}
                      fontSize={12}
                      fill="hsl(var(--muted-foreground))"
                    />
                  </Bar>
                  <YAxis dataKey="date" type="category" tickCount={1} hide />
                  <XAxis dataKey="accuracy" type="number" hide />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:max-w-md">
          <CardHeader className="p-4 pb-0">
            <CardTitle>Engagement Level</CardTitle>
            <CardDescription>
              Over the last 7 days, you&apos;ve maintained a high engagement level.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-baseline gap-4 p-4 pt-0">
            <div className="flex items-baseline gap-1 text-3xl font-bold tabular-nums leading-none">
              {latestPerformance.engagementLevel}%
              <span className="text-sm font-normal text-muted-foreground">
                engaged
              </span>
            </div>
            <ChartContainer
              config={{
                engagement: {
                  label: 'Engagement',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="ml-auto w-[72px]"
            >
              <RadialBarChart
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                data={userPerformance.map((performance) => ({
                  ...performance,
                  engagementLevel: performance.engagementLevel,
                }))}
                innerRadius="20%"
                barSize={24}
                startAngle={90}
                endAngle={450}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  dataKey="engagementLevel"
                  tick={false}
                />
                <RadialBar
                  dataKey="engagementLevel"
                  background
                  cornerRadius={5}
                />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
