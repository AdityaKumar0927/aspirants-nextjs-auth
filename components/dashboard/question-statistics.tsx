import { Card, CardContent } from "@/components/ui/card"
import type { FC } from "react"

interface StatItem {
  name: string
  count: number
}

interface Statistics {
  totalQuestions: number
  exams: StatItem[]
  chapterGroups: StatItem[]
  topics: StatItem[]
  subtopics: StatItem[]
  difficultyDistribution: Array<{ difficulty: string; count: number }>
}

async function getStatistics(): Promise<Statistics> {
  try {
    const res = await fetch("/api/statistics", { cache: "no-store" })
    if (!res.ok) {
      throw new Error("Failed to fetch statistics")
    }
    const data = await res.json()
    return {
      totalQuestions: data.totalQuestions || 0,
      exams: data.exams || [],
      chapterGroups: data.chapterGroups || [],
      topics: data.topics || [],
      subtopics: data.subtopics || [],
      difficultyDistribution: data.difficultyDistribution || [],
    }
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return {
      totalQuestions: 0,
      exams: [],
      chapterGroups: [],
      topics: [],
      subtopics: [],
      difficultyDistribution: [],
    }
  }
}

const StatCard: FC<{ value: string; label: string }> = ({ value, label }) => (
  <Card className="border-none shadow-none">
    <CardContent className="p-0">
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground mt-1">{label}</span>
      </div>
    </CardContent>
  </Card>
)

export default async function QuestionStatistics() {
  const stats = await getStatistics()

  const statCards = [
    { value: stats.totalQuestions.toString(), label: "Total Questions" },
    { value: stats.exams.length.toString(), label: "Unique Exams" },
    { value: stats.chapterGroups.length.toString(), label: "Chapter Groups" },
    { value: stats.topics.length.toString(), label: "Topics" },
  ]

  return (
    <section id="stats">
      <div className="container px-4 md:px-6 py-12 md:py-24">
        <div className="text-center space-y-4 py-6 mx-auto">
          <h2 className="text-[14px] text-primary font-mono font-medium tracking-tight">Question Statistics</h2>
          <h4 className="text-[42px] font-medium mb-2 text-balance max-w-3xl mx-auto tracking-tighter">
            Powering education worldwide
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statCards.map((stat, index) => (
            <StatCard key={index} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  )
}

