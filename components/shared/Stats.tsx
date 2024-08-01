"use client";

import { useUserPerformance } from "@/components/layout/UserPerformanceContext";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
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
  createdAt: string;
}

const calculateAverage = (data: UserPerformance[], key: keyof UserPerformance): number => {
  const total = data.reduce((sum, item) => sum + (item[key] as number), 0);
  return total / data.length;
};

const Stats: React.FC = () => {
  const { userPerformance, loading } = useUserPerformance();

  if (loading) {
    return (
      <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
        <Skeleton height={300} width="100%" />
        <Skeleton height={300} width="100%" />
        <Skeleton height={300} width="100%" />
      </div>
    );
  }

  const averageAccuracy = calculateAverage(userPerformance, "accuracy");
  const totalQuestionsAttempted = userPerformance.reduce((sum, item) => sum + item.questionsAttempted, 0);
  const totalCorrectAnswers = userPerformance.reduce((sum, item) => sum + item.correctAnswers, 0);
  const totalIncorrectAnswers = userPerformance.reduce((sum, item) => sum + item.incorrectAnswers, 0);
  const averageReattemptAccuracy = calculateAverage(userPerformance, "reattemptAccuracy");

  return (
    <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
        <Card className="lg:max-w-md">
          <CardHeader className="space-y-0 pb-2">
            <CardDescription>Average Accuracy</CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              {averageAccuracy.toFixed(2)}{" "}
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                accuracy: {
                  label: "Accuracy",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <BarChart accessibilityLayer margin={{ left: -4, right: -4 }} data={userPerformance}>
                <Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={5} fillOpacity={0.6} />
                <XAxis
                  dataKey="createdAt"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      weekday: "short",
                    })
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      }
                    />
                  }
                  cursor={false}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1">
            <CardDescription>
              Your average accuracy across all attempts is{" "}
              <span className="font-medium text-foreground">{averageAccuracy.toFixed(2)}%</span>.
            </CardDescription>
          </CardFooter>
        </Card>
        <Card className="flex flex-col lg:max-w-md">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 [&>div]:flex-1">
            <div>
              <CardDescription>Total Questions Attempted</CardDescription>
              <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
                {totalQuestionsAttempted}
                <span className="text-sm font-normal tracking-normal text-muted-foreground">questions</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center">
            <ChartContainer
              config={{
                questionsAttempted: {
                  label: "Questions Attempted",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="w-full"
            >
              <LineChart accessibilityLayer margin={{ left: 14, right: 14, top: 10 }} data={userPerformance}>
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <XAxis
                  dataKey="createdAt"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      weekday: "short",
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
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      }
                    />
                  }
                  cursor={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full flex-1 gap-6 lg:max-w-[20rem]">
        <Card className="max-w-xs">
          <CardHeader>
            <CardTitle>Correct Answers</CardTitle>
            <CardDescription>Total correct answers over time</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ChartContainer
              config={{
                correctAnswers: {
                  label: "Correct Answers",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="aspect-auto h-[32px] w-full"
            >
              <BarChart
                accessibilityLayer
                layout="vertical"
                margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                data={userPerformance}
              >
                <Bar dataKey="correctAnswers" fill="var(--color-correctAnswers)" radius={4} barSize={32}>
                  <LabelList position="insideLeft" dataKey="label" offset={8} fontSize={12} fill="white" />
                </Bar>
                <YAxis dataKey="createdAt" type="category" tickCount={1} hide />
                <XAxis dataKey="correctAnswers" type="number" hide />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="max-w-xs">
          <CardHeader>
            <CardTitle>Incorrect Answers</CardTitle>
            <CardDescription>Total incorrect answers over time</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ChartContainer
              config={{
                incorrectAnswers: {
                  label: "Incorrect Answers",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="aspect-auto h-[32px] w-full"
            >
              <BarChart
                accessibilityLayer
                layout="vertical"
                margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                data={userPerformance}
              >
                <Bar dataKey="incorrectAnswers" fill="var(--color-incorrectAnswers)" radius={4} barSize={32}>
                  <LabelList position="insideLeft" dataKey="label" offset={8} fontSize={12} fill="white" />
                </Bar>
                <YAxis dataKey="createdAt" type="category" tickCount={1} hide />
                <XAxis dataKey="incorrectAnswers" type="number" hide />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="max-w-xs">
          <CardHeader className="space-y-0 pb-0">
            <CardDescription>Reattempt Accuracy</CardDescription>
            <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
              {averageReattemptAccuracy.toFixed(2)}%
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">reattempt accuracy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={{
                reattemptAccuracy: {
                  label: "Reattempt Accuracy",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <LineChart accessibilityLayer data={userPerformance} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="createdAt" hide />
                <YAxis domain={["dataMin - 5", "dataMax + 2"]} hide />
                <Line dataKey="reattemptAccuracy" type="monotone" fill="var(--color-reattemptAccuracy)" stroke="var(--color-reattemptAccuracy)" strokeWidth={2} dot={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                  formatter={(value) => (
                    <div className="flex min-w-[120px] items-center text-xs text-muted-foreground">
                      Reattempt Accuracy
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {value}%
                      </div>
                    </div>
                  )}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
