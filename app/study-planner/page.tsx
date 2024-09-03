"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Calendar, BarChart, Clock, Book, CheckCircle, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Subject = {
  id: number
  name: string
  goal: number
  progress: number
}

type StudySession = {
  id: number
  subjectId: number
  date: string
  duration: number
}

export default function ImprovedStudyPlanner() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [newSubject, setNewSubject] = useState("")
  const [activeTab, setActiveTab] = useState("subjects")
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [sessionDuration, setSessionDuration] = useState("")

  useEffect(() => {
    const savedSubjects = localStorage.getItem("subjects")
    const savedSessions = localStorage.getItem("studySessions")
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects))
    if (savedSessions) setStudySessions(JSON.parse(savedSessions))
  }, [])

  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects))
  }, [subjects])

  useEffect(() => {
    localStorage.setItem("studySessions", JSON.stringify(studySessions))
  }, [studySessions])

  const addSubject = () => {
    if (newSubject.trim() !== "") {
      const newSubjectObj = {
        id: Date.now(),
        name: newSubject,
        goal: 0,
        progress: 0,
      }
      setSubjects([...subjects, newSubjectObj])
      setNewSubject("")
    }
  }

  const removeSubject = (id: number) => {
    setSubjects(subjects.filter((subject) => subject.id !== id))
    setStudySessions(studySessions.filter((session) => session.subjectId !== id))
  }

  const updateGoal = (id: number, goal: number) => {
    setSubjects(
      subjects.map((subject) =>
        subject.id === id ? { ...subject, goal } : subject
      )
    )
  }

  const updateProgress = (id: number, progress: number) => {
    setSubjects(
      subjects.map((subject) =>
        subject.id === id ? { ...subject, progress } : subject
      )
    )
  }

  const addStudySession = () => {
    if (selectedSubject && sessionDuration) {
      const newSession = {
        id: Date.now(),
        subjectId: selectedSubject,
        date: selectedDate,
        duration: Number(sessionDuration),
      }
      setStudySessions([...studySessions, newSession])
      updateProgress(selectedSubject, subjects.find(s => s.id === selectedSubject)!.progress + Number(sessionDuration))
      setSessionDuration("")
    }
  }

  const totalProgress = subjects.reduce(
    (sum, subject) => sum + (subject.progress / subject.goal) * 100,
    0
  )
  const averageProgress = subjects.length > 0 ? totalProgress / subjects.length : 0

  const totalStudyTime = studySessions.reduce((sum, session) => sum + session.duration, 0)

  const subjectWithMostTime = subjects.reduce((max, subject) => {
    const subjectTime = studySessions
      .filter(session => session.subjectId === subject.id)
      .reduce((sum, session) => sum + session.duration, 0)
    return subjectTime > max.time ? { name: subject.name, time: subjectTime } : max
  }, { name: "", time: 0 })

  const subjectsWithProgress = subjects.map(subject => ({
    ...subject,
    totalTime: studySessions
      .filter(session => session.subjectId === subject.id)
      .reduce((sum, session) => sum + session.duration, 0)
  }))

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Improved Study Planner</CardTitle>
        <CardDescription>Organize your studies, track progress, and schedule sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 gap-4">
            <TabsTrigger value="subjects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Subjects</TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Calendar</TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Statistics</TabsTrigger>
          </TabsList>
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Add a new subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubject()}
                className="flex-grow"
              />
              <Button onClick={addSubject} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Add Subject
              </Button>
            </div>
            {subjects.map((subject) => (
              <Card key={subject.id} className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Book className="mr-2 h-5 w-5 text-primary" />
                    {subject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Study goal (hours)"
                      value={subject.goal || ""}
                      onChange={(e) => updateGoal(subject.id, Number(e.target.value))}
                      className="w-1/3"
                    />
                    <Input
                      type="number"
                      placeholder="Progress (hours)"
                      value={subject.progress || ""}
                      onChange={(e) => updateProgress(subject.id, Number(e.target.value))}
                      className="w-1/3"
                    />
                    <Progress
                      value={subject.goal > 0 ? (subject.progress / subject.goal) * 100 : 0}
                      className="w-1/3"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" onClick={() => removeSubject(subject.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Schedule Study Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                    <Select onValueChange={(value) => setSelectedSubject(Number(value))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="Study duration"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addStudySession} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Add Study Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Study Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studySessions
                  .filter((session) => new Date(session.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((session) => (
                    <Card key={session.id} className="bg-accent text-accent-foreground">
                      <CardContent className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">
                            {subjects.find((s) => s.id === session.subjectId)?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{session.date}</p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          <span>{session.duration} hours</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card text-card-foreground col-span-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="mr-2 h-5 w-5 text-primary" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex-grow">
                      <Progress value={averageProgress} className="w-full h-4" />
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {averageProgress.toFixed(1)}%
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Average progress across all subjects
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Total Study Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{totalStudyTime}</div>
                  <p className="text-sm text-muted-foreground">Total hours studied</p>
                </CardContent>
              </Card>
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Book className="mr-2 h-5 w-5 text-primary" />
                    Most Studied Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{subjectWithMostTime.name}</div>
                  <p className="text-sm text-muted-foreground">
                    {subjectWithMostTime.time} hours studied
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card text-card-foreground col-span-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart className="mr-2 h-5 w-5 text-primary" />
                    Subject Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectsWithProgress.map((subject) => (
                      <div key={subject.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{subject.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {subject.progress} / {subject.goal} hours
                          </span>
                        </div>
                        <Progress
                          value={subject.goal > 0 ? (subject.progress / subject.goal) * 100 : 0}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Total time: {subject.totalTime} hours
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}