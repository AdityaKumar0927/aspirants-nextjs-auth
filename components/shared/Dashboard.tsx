import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useLoading } from '@/components/layout/LoadingContext';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
  LabelList,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  Tooltip,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { getSession } from 'next-auth/react';

type UserPerformance = {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  accuracy: number;
  weaknessBySubtopic: { subtopic: string; weakness: number }[];
  improvementOverTime: { date: string; improvement: number }[];
  attemptRate: number;
  firstAttemptSuccessRate: number;
  reattemptAccuracy: number;
  topicPerformance: { topic: string; performance: number }[];
  consistency: number;
  engagementLevel: number;
  completed: boolean;
  reviewed: boolean;
  lastAttempted: string;
  dailyAccuracy: { date: string; accuracy: number }[];
  dailyTimePerQuestion: { date: string; time: number }[];
  dailyStudyTime: { date: string; time: number }[];
  currentYearAccuracy: number;
  previousYearAccuracy: number;
  timePerQuestion: number;
  timePerSubtopic: number;
  dailyTimePerSubtopic: { date: string; time: number }[];
  studyTime: number;
};

const fetchUserPerformance = async (userId: string): Promise<UserPerformance[]> => {
  const response = await fetch(`/api/user-performance/get?userId=${userId}`);
  if (!response.ok) {
    console.error('Failed to fetch user performance');
    return [];
  }
  const data = await response.json();
  console.log('User performance data:', data);
  return data;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getSession(context);
    if (!session || !session.user?.id) {
      return { props: { initialUserPerformance: [] } };
    }
    const data = await fetchUserPerformance(session.user.id);
    return {
      props: {
        initialUserPerformance: data,
        userId: session.user.id,
      },
    };
  } catch (error) {
    console.error('Error fetching user performance:', error);
    return { props: { initialUserPerformance: [] } };
  }
};

export default function Dashboard({ initialUserPerformance, userId }: { initialUserPerformance: UserPerformance[], userId: string }) {
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>(initialUserPerformance);
  const { setLoading } = useLoading();

  useEffect(() => {
    const getUserPerformance = async () => {
      setLoading(true);
      try {
        const data = await fetchUserPerformance(userId);
        console.log('Fetched user performance:', data);
        setUserPerformance(data);
      } catch (error) {
        console.error('Error fetching user performance:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!userPerformance.length) {
      getUserPerformance();
    }
  }, [setLoading, userPerformance, userId]);

  if (!userPerformance.length) {
    return (
      <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
        <div className="text-center text-gray-500">
          No user performance data available. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
        {userPerformance.map((performance) => (
          <Card key={performance.questionId} className="lg:max-w-md">
            <CardHeader className="space-y-0 pb-2">
              <CardDescription>Today</CardDescription>
              <CardTitle className="text-4xl tabular-nums">
                {performance.accuracy}{' '}
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
                  data={performance.dailyAccuracy}
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
        ))}
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
                {userPerformance[0].currentYearAccuracy}%
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
                  data={[{ date: '2024', accuracy: userPerformance[0].currentYearAccuracy }]}
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
                {userPerformance[0].previousYearAccuracy}%
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
                  data={[{ date: '2023', accuracy: userPerformance[0].previousYearAccuracy }]}
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
            <CardTitle>Time per Subtopic</CardTitle>
            <CardDescription>
              Over the last 7 days, you&apos;ve spent an average of 1.5 hours per subtopic per day.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-baseline gap-4 p-4 pt-0">
            <div className="flex items-baseline gap-1 text-3xl font-bold tabular-nums leading-none">
              {userPerformance[0].timePerSubtopic}
              <span className="text-sm font-normal text-muted-foreground">
                hr/day
              </span>
            </div>
            <ChartContainer
              config={{
                time: {
                  label: 'Time',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="ml-auto w-[72px]"
            >
              <BarChart
                accessibilityLayer
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                data={userPerformance[0].dailyTimePerSubtopic}
              >
                <Bar
                  dataKey="time"
                  fill="var(--color-time)"
                  radius={2}
                  fillOpacity={0.2}
                  activeIndex={6}
                  activeBar={<Rectangle fillOpacity={0.8} />}
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
        <Card className="lg:max-w-md">
          <CardContent className="flex gap-4 p-4 pb-2">
            <ChartContainer
              config={{
                speed: {
                  label: 'Speed',
                  color: 'hsl(var(--chart-1))',
                },
                accuracy: {
                  label: 'Accuracy',
                  color: 'hsl(var(--chart-2))',
                },
                consistency: {
                  label: 'Consistency',
                  color: 'hsl(var(--chart-3))',
                },
              }}
              className="h-[140px] w-full"
            >
              <BarChart
                margin={{ left: 0, right: 0, top: 0, bottom: 10 }}
                data={[
                  {
                    activity: 'speed',
                    value: (userPerformance[0].timePerQuestion / 5) * 100,
                    label: `${userPerformance[0].timePerQuestion} min/q`,
                    fill: 'var(--color-speed)',
                  },
                  {
                    activity: 'accuracy',
                    value: userPerformance[0].accuracy,
                    label: `${userPerformance[0].accuracy}%`,
                    fill: 'var(--color-accuracy)',
                  },
                  {
                    activity: 'consistency',
                    value: userPerformance[0].consistency,
                    label: `${userPerformance[0].consistency}%`,
                    fill: 'var(--color-consistency)',
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
                  {userPerformance[0].timePerQuestion}
                  <span className="text-sm font-normal text-muted-foreground">
                    min/q
                  </span>
                </div>
              </div>
              <Separator orientation="vertical" className="mx-2 h-10 w-px" />
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                  {userPerformance[0].accuracy}
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <Separator orientation="vertical" className="mx-2 h-10 w-px" />
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-xs text-muted-foreground">Consistency</div>
                <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                  {userPerformance[0].consistency}
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
                  {userPerformance[0].timePerQuestion} min/q
                  <span className="text-sm font-normal text-muted-foreground">
                    min/q
                  </span>
                </div>
              </div>
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="flex items-baseline gap-1 text-xl font-bold tabular-nums leading-none">
                  {userPerformance[0].accuracy}%
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div className="grid flex-1 auto-rows-min gap-0.5">
                <div className="text-sm text-muted-foreground">Consistency</div>
                <div className="flex items-baseline gap-1 text-xl font-bold tabular-nums leading-none">
                  {userPerformance[0].consistency}%
                  <span className="text-sm font-normal text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
            <ChartContainer
              config={{
                speed: {
                  label: 'Speed',
                  color: 'hsl(var(--chart-1))',
                },
                accuracy: {
                  label: 'Accuracy',
                  color: 'hsl(var(--chart-2))',
                },
                consistency: {
                  label: 'Consistency',
                  color: 'hsl(var(--chart-3))',
                },
              }}
              className="mx-auto aspect-square w-full max-w-[80%]"
            >
              <RadialBarChart
                margin={{ left: -10, right: -10, top: -10, bottom: -10 }}
                data={[
                  { activity: 'speed', value: (userPerformance[0].timePerQuestion / 5) * 100, fill: 'var(--color-speed)' },
                  { activity: 'accuracy', value: userPerformance[0].accuracy, fill: 'var(--color-accuracy)' },
                  { activity: 'consistency', value: userPerformance[0].consistency, fill: 'var(--color-consistency)' },
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
              You&apos;re maintaining an average accuracy of {userPerformance[0].accuracy}%. Good job!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-baseline gap-4 p-4 pt-2">
            <div className="flex items-baseline gap-2 text-3xl font-bold tabular-nums leading-none">
              {userPerformance[0].accuracy}%
              <span className="text-sm font-normal text-muted-foreground">
                accuracy
              </span>
            </div>
            <ChartContainer
              config={{
                accuracy: {
                  label: 'Accuracy',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="ml-auto w-[72px]"
            >
              <BarChart
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                data={[{ date: '2024', accuracy: userPerformance[0].accuracy }]}
              >
                <Bar
                  dataKey="accuracy"
                  fill="var(--color-accuracy)"
                  radius={4}
                  barSize={32}
                  fillOpacity={0.6}
                  activeIndex={6}
                  activeBar={<Rectangle fillOpacity={0.8} />}
                >
                  <LabelList
                    position="insideLeft"
                    dataKey="date"
                    fill="white"
                    offset={8}
                    fontSize={12}
                  />
                </Bar>
                <YAxis dataKey="date" type="category" tickCount={1} hide />
                <XAxis dataKey="accuracy" type="number" hide />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="max-w-xs">
          <CardContent className="p-4">
            <div className="flex flex-row items-baseline gap-2 text-3xl font-bold tabular-nums leading-none">
              {userPerformance[0].studyTime}
              <span className="text-sm font-normal text-muted-foreground">
                hrs/day
              </span>
            </div>
            <ChartContainer
              config={{
                time: {
                  label: 'Time',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="ml-auto w-[72px]"
            >
              <AreaChart
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                data={userPerformance[0].dailyStudyTime}
              >
                <Area
                  dataKey="time"
                  type="monotone"
                  fill="var(--color-time)"
                  fillOpacity={0.4}
                  stroke="var(--color-time)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    fill: 'var(--color-time)',
                    stroke: 'var(--color-time)',
                    r: 4,
                  }}
                />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  hide
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
