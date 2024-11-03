"use client"

import React from 'react'
import { useUserPerformance } from "@/components/layout/UserPerformanceContext"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserPerformance {
  questionId: string
  correctAnswers: number
  incorrectAnswers: number
  uniqueQuestions: number
  questionsAttempted: number
  timeSpent: number
  accuracy: number
  weaknessBySubtopic: Record<string, number>
  improvementOverTime: Record<string, number>
  attemptRate: number
  firstAttemptSuccessRate: number
  reattemptAccuracy: number
  topicPerformance: Record<string, number>
  consistency: number
  engagementLevel: number
  completed: boolean
  reviewed: boolean
  createdAt: string
}

const calculateAverage = (data: UserPerformance[], key: keyof UserPerformance): number => {
  const total = data.reduce((sum, item) => sum + (item[key] as number), 0)
  return total / data.length
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function Stats() {
  const { userPerformance, loading } = useUserPerformance()

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <Skeleton height={50} width={300} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton height={300} />
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    )
  }

  const averageAccuracy = calculateAverage(userPerformance, "accuracy")
  const totalQuestionsAttempted = userPerformance.reduce((sum, item) => sum + item.questionsAttempted, 0)
  const averageReattemptAccuracy = calculateAverage(userPerformance, "reattemptAccuracy")
  const averageEngagementLevel = calculateAverage(userPerformance, "engagementLevel")

  const topicPerformanceData = Object.entries(userPerformance[0].topicPerformance).map(([name, value]) => ({
    name,
    value
  }))

  const weaknessData = Object.entries(userPerformance[0].weaknessBySubtopic).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Your Performance Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{averageAccuracy.toFixed(2)}%</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userPerformance}>
                <XAxis dataKey="createdAt" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Questions Attempted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{totalQuestionsAttempted}</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userPerformance}>
                <XAxis dataKey="createdAt" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="questionsAttempted" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reattempt Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{averageReattemptAccuracy.toFixed(2)}%</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userPerformance}>
                <XAxis dataKey="createdAt" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reattemptAccuracy" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="topicPerformance" className="w-full">
        <TabsList>
          <TabsTrigger value="topicPerformance">Topic Performance</TabsTrigger>
          <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
        </TabsList>
        <TabsContent value="topicPerformance">
          <Card>
            <CardHeader>
              <CardTitle>Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topicPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topicPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weaknesses">
          <Card>
            <CardHeader>
              <CardTitle>Weaknesses by Subtopic</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weaknessData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {weaknessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle>Engagement Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">{(averageEngagementLevel * 100).toFixed(2)}%</div>
          <p className="text-sm text-muted-foreground">
            Your engagement level indicates how consistently you're interacting with the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}