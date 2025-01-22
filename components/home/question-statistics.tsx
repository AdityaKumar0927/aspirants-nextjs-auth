import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileQuestion, GraduationCap, Layers, Lightbulb } from "lucide-react"
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
  const res = await fetch("http://localhost:3000/api/statistics", { cache: "no-store" })
  if (!res.ok) {
    throw new Error("Failed to fetch statistics")
  }
  return res.json()
}

interface StatCardProps {
  title: string
  value: number
  icon: FC
}

const StatCard: FC<StatCardProps> = ({ title, value, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
)

interface DistributionCardProps {
  title: string
  data: Array<StatItem | { difficulty: string; count: number }>
  total: number
}

const DistributionCard: FC<DistributionCardProps> = ({ title, data, total }) => (
  <Card className="col-span-3">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {data.map((item, index) => (
        <div key={index} className="mb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{"name" in item ? item.name : item.difficulty}</div>
            <div className="text-sm text-muted-foreground">{item.count}</div>
          </div>
          <div className="mt-1">
            <Progress value={(item.count / total) * 100} />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default async function QuestionStatistics() {
  const stats = await getStatistics()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Questions" value={stats.totalQuestions} icon={FileQuestion} />
        <StatCard title="Unique Exams" value={stats.exams.length} icon={GraduationCap} />
        <StatCard title="Chapter Groups" value={stats.chapterGroups.length} icon={Layers} />
        <StatCard title="Topics" value={stats.topics.length} icon={BookOpen} />
        <StatCard title="Subtopics" value={stats.subtopics.length} icon={Lightbulb} />
      </div>
      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
        </TabsList>
        <TabsContent value="exams" className="space-y-4">
          <DistributionCard title="Exam Distribution" data={stats.exams} total={stats.totalQuestions} />
        </TabsContent>
        <TabsContent value="chapters" className="space-y-4">
          <DistributionCard
            title="Chapter Group Distribution"
            data={stats.chapterGroups}
            total={stats.totalQuestions}
          />
        </TabsContent>
        <TabsContent value="topics" className="space-y-4">
          <DistributionCard title="Topic Distribution" data={stats.topics} total={stats.totalQuestions} />
        </TabsContent>
        <TabsContent value="difficulty" className="space-y-4">
          <DistributionCard
            title="Difficulty Distribution"
            data={stats.difficultyDistribution}
            total={stats.totalQuestions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

