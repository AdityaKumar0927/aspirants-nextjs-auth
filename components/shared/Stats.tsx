'use client'

import { useUserPerformance } from "@/components/layout/UserPerformanceContext"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface UserPerformance {
  questionId: string
  correctAnswers: number
  incorrectAnswers: number
  questionsAttempted: number
  accuracy: number
  reattemptAccuracy: number
  createdAt: string
}

interface StatsProps {
  userId: string | null
}

const calculateAverage = (data: UserPerformance[], key: keyof UserPerformance): number => {
  const total = data.reduce((sum, item) => sum + (item[key] as number), 0)
  return total / data.length
}

const EscapedNumber = ({ value = 0, decimals = 0 }) => (
  <span dangerouslySetInnerHTML={{ __html: Number(value).toFixed(decimals).replace(/"/g, "&quot;") }} />
);

export default function Stats({ userId }: StatsProps) {
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

  const averageAccuracy = calculateAverage(userPerformance, "accuracy")
  const totalQuestionsAttempted = userPerformance.reduce((sum, item) => sum + item.questionsAttempted, 0)
  const averageReattemptAccuracy = calculateAverage(userPerformance, "reattemptAccuracy")

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: "Average Accuracy".replace(/"/g, "&quot;") }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            <EscapedNumber value={averageAccuracy} decimals={2} />%
          </div>
          <p className="text-xs text-muted-foreground">
            {"+2.5% from last week".replace(/%/g, "&#37;")}
          </p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userPerformance}>
                <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: "Total Questions Attempted".replace(/"/g, "&quot;") }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            <EscapedNumber value={totalQuestionsAttempted} />
          </div>
          <p className="text-xs text-muted-foreground">
            {"+12 from last week".replace(/%/g, "&#37;")}
          </p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userPerformance}>
                <Bar dataKey="questionsAttempted" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: "Correct Answers".replace(/"/g, "&quot;") }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            <EscapedNumber value={userPerformance[userPerformance.length - 1]?.correctAnswers} />
          </div>
          <p className="text-xs text-muted-foreground">
            {"+7 from last week".replace(/%/g, "&#37;")}
          </p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userPerformance}>
                <Line type="monotone" dataKey="correctAnswers" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: "Reattempt Accuracy".replace(/"/g, "&quot;") }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            <EscapedNumber value={averageReattemptAccuracy} decimals={2} />%
          </div>
          <p className="text-xs text-muted-foreground">
            {"+1.2% from last week".replace(/%/g, "&#37;")}
          </p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userPerformance}>
                <Line type="monotone" dataKey="reattemptAccuracy" stroke="#ea580c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}