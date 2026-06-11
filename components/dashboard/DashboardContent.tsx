"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  return (
    <div className="bg-white dark:bg-dark-background chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
        <Card className="lg:max-w-md">
          <CardHeader className="space-y-0 pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              12,584{" "}
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                accuracy
              </span>
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
              <BarChart
                accessibilityLayer
                margin={{ left: -4, right: -4 }}
                data={[
                  { date: "2024-01-01", accuracy: 75 },
                  { date: "2024-01-02", accuracy: 80 },
                  { date: "2024-01-03", accuracy: 70 },
                  { date: "2024-01-04", accuracy: 85 },
                  { date: "2024-01-05", accuracy: 90 },
                  { date: "2024-01-06", accuracy: 65 },
                  { date: "2024-01-07", accuracy: 78 },
                ]}
              >
                <Bar
                  dataKey="accuracy"
                  fill="var(--color-accuracy)"
                  radius={5}
                  fillOpacity={0.6}
                  activeBar={<Rectangle fillOpacity={0.8} />}
                />
                <XAxis
                  dataKey="date"
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
                  defaultIndex={2}
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
              Over the past 7 days, your accuracy has been{" "}
              <span className="font-medium text-foreground">75%</span>.
            </CardDescription>
            <CardDescription>
              You need{" "}
              <span className="font-medium text-foreground">80%</span> accuracy
              to reach your goal.
            </CardDescription>
          </CardFooter>
        </Card>
        <Card className="flex flex-col lg:max-w-md">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 [&>div]:flex-1">
            <div>
              <CardDescription>Time per Question</CardDescription>
              <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
                2.5
                <span className="text-sm font-normal tracking-normal text-muted-foreground">
                  min/question
                </span>
              </CardTitle>
            </div>
            <div>
              <CardDescription>Consistency</CardDescription>
              <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
                75%
                <span className="text-sm font-normal tracking-normal text-muted-foreground">
                  consistent
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center">
            <ChartContainer
              config={{
                time: {
                  label: "Time",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="w-full"
            >
              <LineChart
                accessibilityLayer
                margin={{ left: 14, right: 14, top: 10 }}
                data={[
                  { date: "2024-01-01", time: 2.0 },
                  { date: "2024-01-02", time: 2.5 },
                  { date: "2024-01-03", time: 3.0 },
                  { date: "2024-01-04", time: 2.2 },
                  { date: "2024-01-05", time: 2.8 },
                  { date: "2024-01-06", time: 2.0 },
                  { date: "2024-01-07", time: 2.5 },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.5}
                />
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <XAxis
                  dataKey="date"
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
                  dataKey="time"
                  type="natural"
                  fill="var(--color-time)"
                  stroke="var(--color-time)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    fill: "var(--color-time)",
                    stroke: "var(--color-time)",
                    r: 4,
                  }}
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
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              You&apos;re averaging better accuracy this year compared to last year.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid auto-rows-min gap-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                85%
                <span className="text-sm font-normal text-muted-foreground">
                  accuracy/day
                </span>
              </div>
              <ChartContainer
                config={{
                  accuracy: {
                    label: "Accuracy",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  data={[
                    { date: "2024", accuracy: 85 },
                  ]}
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
                75%
                <span className="text-sm font-normal text-muted-foreground">
                  accuracy/day
                </span>
              </div>
              <ChartContainer
                config={{
                  accuracy: {
                    label: "Accuracy",
                    color: "hsl(var(--muted))",
                  },
                }}
                className="aspect-auto h-[32px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  margin={{ left: 0, top: 0, right: 0, bottom: 0 }}
                  data={[
                    { date: "2023", accuracy: 75 },
                  ]}
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
        <Card className="max-w-xs">
          <CardHeader className="p-4 pb-0">
            <CardTitle>Time per Subtopic</CardTitle>
            <CardDescription>
              Over the last 7 days, you&apos;ve spent an average of 1.5 hours per subtopic per day.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-baseline gap-4 p-4 pt-0">
            <div className="flex items-baseline gap-1 text-3xl font-bold tabular-nums leading-none">
              1.5
              <span className="text-sm font-normal text-muted-foreground">
                hr/day
              </span>
            </div>
            <ChartContainer
              config={{
                time: {
                  label: "Time",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="ml-auto w-[72px]"
            >
              <BarChart
                accessibilityLayer
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                data={[
                  { date: "2024-01-01", time: 1.0 },
                  { date: "2024-01-02", time: 1.2 },
                  { date: "2024-01-03", time: 1.5 },
                  { date: "2024-01-04", time: 2.0 },
                  { date: "2024-01-05", time: 1.8 },
                  { date: "2024-01-06", time: 1.4 },
                  { date: "2024-01-07", time: 1.5 },
                ]}
              >
                <Bar
                  dataKey="time"
                  fill="var(--color-time)"
                  radius={2}
                  fillOpacity={0.2}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  hide
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="max-w-xs">
          <CardContent className="flex gap-4 p-4 pb-2">
            <ChartContainer
              config={{
                speed: {
                  label: "Speed",
                  color: "hsl(var(--chart-1))",
                },
                accuracy: {
                  label: "Accuracy",
                  color: "hsl(var(--chart-2))",
                },
                consistency: {
                  label: "Consistency",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[140px] w-full"
            >
              <BarChart
                margin={{ left: 0, right: 0, top: 0, bottom: 10 }}
                data={[
                  {
                    activity: "speed",
                    value: 2.5,
                    label: "2.5 min/q",
                    fill: "var(--color-speed)",
                  },
                  {
                    activity: "accuracy",
                    value: 85,
                    label: "85%",
                    fill: "var(--color-accuracy)",
                  },
                  {
                    activity: "consistency",
                    value: 75,
                    label: "75%",
                    fill: "var(--color-consistency)",
                  },
                ]}
                layout="vertical"
                barSize={32}
                barGap={2}
              >
                <XAxis type="number" dataKey="value" hide />
                <YAxis
                  dataKey="activity"
                  type="category"
                  tickLine={false}
                  tickMargin={4}
                  axisLine={false}
                  className="capitalize"
                />
                <Bar dataKey="value" radius={5}>
                  <LabelList
                    position="insideLeft"
                    dataKey="label"
                    fill="white"
                    offset={8}
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex flex-row border-t p-4">
            <div className="flex w-full items-center gap-2">
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-xs text-muted-foreground">Speed</div>
                <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                  2.5
                  <span className="text-sm font-normal text-muted-foreground">
                    min/q
                  </span>
                </div>
              </div>
              <Separator orientation="vertical" className="mx-2 h-10 w-px" />
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                  85
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <Separator orientation="vertical" className="mx-2 h-10 w-px" />
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-xs text-muted-foreground">Consistency</div>
                <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                  75
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="grid w-full flex-1 gap-6">
        <Card className="max-w-xs">
          <CardContent className="flex gap-4 p-4">
            <div className="grid items-center gap-2">
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-sm text-muted-foreground">Speed</div>
                <div className="flex items-baseline gap-1 text-xl font-bold tabular-nums leading-none">
                  2.5 min/q
                  <span className="text-sm font-normal text-muted-foreground">
                    min/q
                  </span>
                </div>
              </div>
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="flex items-baseline gap-1 text-xl font-bold tabular-nums leading-none">
                  85%
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-sm text-muted-foreground">Consistency</div>
                <div className="flex items-baseline gap-1 text-xl font-bold tabular-nums leading-none">
                  75%
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
            <ChartContainer
              config={{
                speed: {
                  label: "Speed",
                  color: "hsl(var(--chart-1))",
                },
                accuracy: {
                  label: "Accuracy",
                  color: "hsl(var(--chart-2))",
                },
                consistency: {
                  label: "Consistency",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="mx-auto aspect-square w-full max-w-[80%]"
            >
              <RadialBarChart
                margin={{ left: -10, right: -10, top: -10, bottom: -10 }}
                data={[
                  { activity: "speed", value: (2.5 / 5) * 100, fill: "var(--color-speed)" },
                  { activity: "accuracy", value: 85, fill: "var(--color-accuracy)" },
                  { activity: "consistency", value: 75, fill: "var(--color-consistency)" },
                ]}
                innerRadius="20%"
                barSize={24}
                startAngle={90}
                endAngle={450}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  dataKey="value"
                  tick={false}
                />
                <RadialBar dataKey="value" background cornerRadius={5} />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="max-w-xs">
          <CardHeader className="p-4 pb-0">
            <CardTitle>Active Learning</CardTitle>
            <CardDescription>
              You&apos;re maintaining an average accuracy of 85%. Good job!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-baseline gap-4 p-4 pt-2">
            <div className="flex items-baseline gap-2 text-3xl font-bold tabular-nums leading-none">
              85%
              <span className="text-sm font-normal text-muted-foreground">
                accuracy
              </span>
            </div>
            <ChartContainer
              config={{
                accuracy: {
                  label: "Accuracy",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="ml-auto w-[64px]"
            >
              <BarChart
                accessibilityLayer
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                data={[
                  { date: "2024-01-01", accuracy: 85 },
                  { date: "2024-01-02", accuracy: 87 },
                  { date: "2024-01-03", accuracy: 82 },
                  { date: "2024-01-04", accuracy: 84 },
                  { date: "2024-01-05", accuracy: 86 },
                  { date: "2024-01-06", accuracy: 85 },
                  { date: "2024-01-07", accuracy: 83 },
                ]}
              >
                <Bar
                  dataKey="accuracy"
                  fill="var(--color-accuracy)"
                  radius={2}
                  fillOpacity={0.2}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  hide
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="max-w-xs">
          <CardHeader className="space-y-0 pb-0">
            <CardDescription>Study Time</CardDescription>
            <CardTitle className="flex items-baseline gap-1 text-4xl tabular-nums">
              8
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                hr
              </span>
              35
              <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
                min
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={{
                time: {
                  label: "Time",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <AreaChart
                accessibilityLayer
                data={[
                  { date: "2024-01-01", time: 8.5 },
                  { date: "2024-01-02", time: 7.2 },
                  { date: "2024-01-03", time: 8.1 },
                  { date: "2024-01-04", time: 6.2 },
                  { date: "2024-01-05", time: 5.2 },
                  { date: "2024-01-06", time: 8.1 },
                  { date: "2024-01-07", time: 7.0 },
                ]}
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
              >
                <XAxis dataKey="date" hide />
                <YAxis domain={["dataMin - 5", "dataMax + 2"]} hide />
                <defs>
                  <linearGradient id="fillTime" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-time)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-time)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="time"
                  type="natural"
                  fill="url(#fillTime)"
                  fillOpacity={0.4}
                  stroke="var(--color-time)"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                  formatter={(value) => (
                    <div className="flex min-w-[120px] items-center text-xs text-muted-foreground">
                      Study time
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {value}
                        <span className="font-normal text-muted-foreground">
                          hr
                        </span>
                      </div>
                    </div>
                  )}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
