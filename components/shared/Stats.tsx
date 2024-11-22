"use client"

import * as React from "react"
import { useUserPerformance } from "@/components/layout/UserPerformanceContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer } from "@/components/ui/chart"
import { MoreHorizontal, ExternalLink, BookOpen, Clock, Award, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'

import type { 
  AreaProps, 
  XAxisProps, 
  YAxisProps, 
  TooltipProps, 
  LegendProps,
  ResponsiveContainerProps,
  LineProps,
  BarProps
} from 'recharts'

const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart) as Promise<React.ComponentType<any>>, { ssr: false })
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart) as Promise<React.ComponentType<any>>, { ssr: false })
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart) as Promise<React.ComponentType<any>>, { ssr: false })
const Area = dynamic(() => import('recharts').then((mod) => mod.Area) as Promise<React.ComponentType<AreaProps>>, { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis) as Promise<React.ComponentType<XAxisProps>>, { ssr: false })
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis) as Promise<React.ComponentType<YAxisProps>>, { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip) as Promise<React.ComponentType<TooltipProps<number, string>>>, { ssr: false })
const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend) as Promise<React.ComponentType<LegendProps>>, { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer) as Promise<React.ComponentType<ResponsiveContainerProps>>, { ssr: false })
const Line = dynamic(() => import('recharts').then((mod) => mod.Line) as Promise<React.ComponentType<LineProps>>, { ssr: false })
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar) as Promise<React.ComponentType<BarProps>>, { ssr: false })

const EscapedNumber = ({ value = 0, decimals = 0 }: { value: number, decimals?: number }) => (
  <span dangerouslySetInnerHTML={{ __html: Number(value).toFixed(decimals).replace(/"/g, "&quot;") }} />
)

export default function StatsPage() {
  const { userPerformance, loading } = useUserPerformance()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full" />
        ))}
      </div>
    )
  }

  const averageAccuracy = userPerformance.reduce((sum, item) => sum + item.accuracy, 0) / userPerformance.length
  const totalQuestionsAttempted = userPerformance.reduce((sum, item) => sum + item.questionsAttempted, 0)
  const averageReattemptAccuracy = userPerformance.reduce((sum, item) => sum + item.reattemptAccuracy, 0) / userPerformance.length
  const totalCorrectAnswers = userPerformance.reduce((sum, item) => sum + item.correctAnswers, 0)

  const performanceData = userPerformance.map(item => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    correctAnswers: item.correctAnswers,
    questionsAttempted: item.questionsAttempted,
    accuracy: item.accuracy,
  }))

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-light text-gray-800">
          Question Bank Analytics
        </h1>
        <div className="flex items-center gap-4">
          <Select defaultValue="week">
            <SelectTrigger className="w-[180px] bg-white border-gray-200">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="border-gray-200 text-gray-600 hover:text-gray-800">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-gray-600">Average Accuracy</CardTitle>
            <Award className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800"><EscapedNumber value={averageAccuracy} decimals={2} />%</div>
            <p className="text-xs text-muted-foreground mt-1">+2.5% from last week</p>
            <div className="h-[80px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-gray-600">Questions Attempted</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">{totalQuestionsAttempted}</div>
            <p className="text-xs text-muted-foreground mt-1">92 per day on average</p>
            <div className="h-[80px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <Bar dataKey="questionsAttempted" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-gray-600">Correct Answers</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800">{totalCorrectAnswers}</div>
            <p className="text-xs text-muted-foreground mt-1">+7 from last week</p>
            <div className="h-[80px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <Line type="monotone" dataKey="correctAnswers" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-gray-600">Reattempt Accuracy</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-gray-800"><EscapedNumber value={averageReattemptAccuracy} decimals={2} />%</div>
            <p className="text-xs text-muted-foreground mt-1">+1.2% from last week</p>
            <div className="h-[80px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userPerformance}>
                  <Line type="monotone" dataKey="reattemptAccuracy" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-normal flex items-center gap-2 text-gray-700">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer
            config={{
              correctAnswers: {
                label: "Correct Answers",
                color: "hsl(24, 100%, 50%)",
              },
              questionsAttempted: {
                label: "Questions Attempted",
                color: "hsl(142, 76%, 36%)",
              },
              accuracy: {
                label: "Accuracy",
                color: "hsl(217, 91%, 60%)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCorrectAnswers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQuestionsAttempted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="correctAnswers"
                  stroke="hsl(24, 100%, 50%)"
                  fillOpacity={1}
                  fill="url(#colorCorrectAnswers)"
                />
                <Area
                  type="monotone"
                  dataKey="questionsAttempted"
                  stroke="hsl(142, 76%, 36%)"
                  fillOpacity={1}
                  fill="url(#colorQuestionsAttempted)"
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(217, 91%, 60%)"
                  fillOpacity={1}
                  fill="url(#colorAccuracy)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-normal flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Top Performing Categories
            </CardTitle>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {["Mathematics", "Science", "History", "Language"].map((subject, index) => (
                  <TableRow key={subject}>
                    <TableCell className="font-medium">{subject}</TableCell>
                    <TableCell className="text-right">{95 - index * 2}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between mt-4">
              <Button variant="outline" size="sm">
                View All
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-normal flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Areas for Improvement
            </CardTitle>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {["Geography", "Literature", "Physics", "Chemistry"].map((subject, index) => (
                  <TableRow key={subject}>
                    <TableCell className="font-medium">{subject}</TableCell>
                    <TableCell className="text-right">{65 + index * 5}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between mt-4">
              <Button variant="outline" size="sm">
                View All
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}