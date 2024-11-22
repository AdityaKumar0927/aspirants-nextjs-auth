"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { ResponsiveLine } from "@nivo/line"
import { ResponsivePie } from "@nivo/pie"
import { ResponsiveRadar } from "@nivo/radar"
import { Trophy, RefreshCw, ArrowUp, ArrowDown, Minus, X, Search, Filter, SearchIcon } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { IconSearch } from "@tabler/icons-react"

interface User {
  username: string
  avatar: string
  questionsSolved: number
  accuracy: number
  attempted: number
  timePerQuestion: string
  trend: "up" | "down" | "neutral"
  lastActive: string
  streak: number
  tags: string[]
  joinDate: string
  rank: number
  contributions: number
}

const users: User[] = [
  {
    username: "shadcn",
    avatar: "/placeholder.svg?height=40&width=40",
    questionsSolved: 12345,
    accuracy: 92.3,
    attempted: 13500,
    timePerQuestion: "12s",
    trend: "up",
    lastActive: "2h ago",
    streak: 7,
    tags: ["algorithms", "data structures", "dynamic programming"],
    joinDate: "2022-03-15",
    rank: 1,
    contributions: 250,
  },
  {
    username: "jaredpalmer",
    avatar: "/placeholder.svg?height=40&width=40",
    questionsSolved: 11987,
    accuracy: 89.7,
    attempted: 13200,
    timePerQuestion: "14s",
    trend: "down",
    lastActive: "1d ago",
    streak: 3,
    tags: ["react", "javascript", "web development"],
    joinDate: "2022-05-20",
    rank: 2,
    contributions: 180,
  },
  {
    username: "maxleiter",
    avatar: "/placeholder.svg?height=40&width=40",
    questionsSolved: 10654,
    accuracy: 87.2,
    attempted: 12800,
    timePerQuestion: "16s",
    trend: "up",
    lastActive: "3h ago",
    streak: 5,
    tags: ["system design", "databases", "networking"],
    joinDate: "2022-04-10",
    rank: 3,
    contributions: 210,
  },
  {
    username: "shuding_",
    avatar: "/placeholder.svg?height=40&width=40",
    questionsSolved: 9876,
    accuracy: 84.5,
    attempted: 11900,
    timePerQuestion: "18s",
    trend: "neutral",
    lastActive: "5h ago",
    streak: 2,
    tags: ["machine learning", "python", "data science"],
    joinDate: "2022-06-05",
    rank: 4,
    contributions: 150,
  },
  {
    username: "lee_robinson",
    avatar: "/placeholder.svg?height=40&width=40",
    questionsSolved: 8765,
    accuracy: 81.2,
    attempted: 10800,
    timePerQuestion: "20s",
    trend: "up",
    lastActive: "1h ago",
    streak: 4,
    tags: ["frontend", "nextjs", "react"],
    joinDate: "2022-07-01",
    rank: 5,
    contributions: 190,
  },
]

export default function LeaderboardPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("questionsSolved")

  const handleUserClick = useCallback((user: User) => {
    setSelectedUser(user)
  }, [])

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b[sortBy as keyof User] as number) - (a[sortBy as keyof User] as number))
  }, [searchTerm, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <IconSearch></IconSearch>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="questionsSolved">Questions Solved</SelectItem>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="attempted">Attempted</SelectItem>
                  <SelectItem value="contributions">Contributions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Solved</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Attempted</TableHead>
                  <TableHead className="text-right">Time/Q</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead className="text-center">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow
                    key={user.username}
                    className="cursor-pointer transition-colors hover:bg-gray-100"
                    onClick={() => handleUserClick(user)}
                  >
                    <TableCell className="font-medium">
                      {index === 0 && <Trophy className="inline-block w-5 h-5 text-yellow-500 mr-1" />}
                      {index === 1 && <Trophy className="inline-block w-5 h-5 text-gray-400 mr-1" />}
                      {index === 2 && <Trophy className="inline-block w-5 h-5 text-amber-600 mr-1" />}
                      {user.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={`@${user.username}`} />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">Last active: {user.lastActive}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{user.questionsSolved.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{user.accuracy}%</TableCell>
                    <TableCell className="text-right">{user.attempted.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{user.timePerQuestion}</TableCell>
                    <TableCell className="text-center">
                      {user.trend === "up" && <ArrowUp className="inline-block text-green-500" />}
                      {user.trend === "down" && <ArrowDown className="inline-block text-red-500" />}
                      {user.trend === "neutral" && <Minus className="inline-block text-yellow-500" />}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {user.streak} days
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-bold">{selectedUser.username}</div>
                  <div className="text-sm text-gray-500">User Analytics</div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              <StatItem title="Questions Solved" value={selectedUser.questionsSolved.toLocaleString()} icon={<Trophy className="h-4 w-4 text-yellow-500" />} />
              <StatItem title="Accuracy" value={`${selectedUser.accuracy}%`} icon={<ArrowUp className="h-4 w-4 text-green-500" />} />
              <StatItem title="Attempted" value={selectedUser.attempted.toLocaleString()} icon={<RefreshCw className="h-4 w-4 text-blue-500" />} />
              <StatItem title="Time per Question" value={selectedUser.timePerQuestion} icon={<Minus className="h-4 w-4 text-purple-500" />} />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Performance Trend</h3>
              <div className="h-[200px]">
                <ResponsiveLine
                  data={[
                    {
                      id: "Performance",
                      data: [
                        { x: "Week 1", y: 43 },
                        { x: "Week 2", y: 137 },
                        { x: "Week 3", y: 61 },
                        { x: "Week 4", y: 145 },
                        { x: "Week 5", y: 26 },
                        { x: "Week 6", y: 154 },
                      ],
                    },
                  ]}
                  margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                  xScale={{ type: "point" }}
                  yScale={{ type: "linear", min: "auto", max: "auto" }}
                  curve="cardinal"
                  axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: "Weeks", legendOffset: 36 }}
                  axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: "Questions Solved", legendOffset: -40 }}
                  pointSize={8}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  useMesh={true}
                  enableSlices="x"
                  colors={["#3b82f6"]}
                  theme={{
                    axis: { ticks: { text: { fontSize: 12 } } },
                    grid: { line: { stroke: "#e2e8f0" } },
                    crosshair: { line: { stroke: "#3b82f6", strokeWidth: 1, strokeOpacity: 0.35 } },
                  }}
                />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Skill Radar</h3>
              <div className="h-[200px]">
                <ResponsiveRadar
                  data={[
                    { skill: "Algorithms", value: 80 },
                    { skill: "Data Structures", value: 90 },
                    { skill: "Problem Solving", value: 85 },
                    { skill: "Time Complexity", value: 70 },
                    { skill: "Space Complexity", value: 75 },
                  ]}
                  keys={["value"]}
                  indexBy="skill"
                  valueFormat=">-.2f"
                  margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                  borderColor={{ from: "color" }}
                  gridLabelOffset={36}
                  dotSize={10}
                  dotColor={{ theme: "background" }}
                  dotBorderWidth={2}
                  colors={{ scheme: "nivo" }}
                  blendMode="multiply"
                  motionConfig="wobbly"
                />
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Top Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedUser.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <DialogClose asChild>
              <Button size="sm" variant="ghost" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function StatItem({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-gray-100 p-2 rounded-full">{icon}</div>
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  )
}