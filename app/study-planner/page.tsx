"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import T from "@/components/i18n/T"

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

  const hydratedRef = useRef(false)
  const canSyncRef = useRef(true) // server sync available (signed in)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load: prefer the server (syncs across devices); fall back to localStorage
  // (guests, or first load before sign-in).
  useEffect(() => {
    let cancelled = false
    const loadLocal = () => {
      try {
        const s = localStorage.getItem("subjects")
        const ss = localStorage.getItem("studySessions")
        if (s) setSubjects(JSON.parse(s))
        if (ss) setStudySessions(JSON.parse(ss))
      } catch {
        /* ignore corrupt cache */
      }
    }
    void (async () => {
      try {
        const res = await fetch("/api/study-plan", { cache: "no-store" })
        if (res.status === 401) {
          canSyncRef.current = false
          loadLocal()
          return
        }
        const { data } = await res.json()
        if (!cancelled && data && (Array.isArray(data.subjects) || Array.isArray(data.studySessions))) {
          setSubjects(data.subjects ?? [])
          setStudySessions(data.studySessions ?? [])
        } else {
          loadLocal()
        }
      } catch {
        loadLocal()
      } finally {
        if (!cancelled) hydratedRef.current = true
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Save: localStorage immediately (offline cache) + debounced server sync.
  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      localStorage.setItem("subjects", JSON.stringify(subjects))
      localStorage.setItem("studySessions", JSON.stringify(studySessions))
    } catch {
      /* ignore */
    }
    if (!canSyncRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch("/api/study-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects, studySessions }),
      })
        .then((r) => {
          if (r.status === 401) canSyncRef.current = false
        })
        .catch(() => {})
    }, 800)
  }, [subjects, studySessions])

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
    <Card className="paper-sheet w-full max-w-5xl mx-auto">
      <CardHeader>
        <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          <T k="auto.studyPlannerPage.dailyStudyRegister" />
        </p>
        <CardTitle className="type-display text-2xl sm:text-3xl">
          <T k="auto.studyPlannerPage.study" /> <span className="highlight-sweep"><T k="auto.studyPlannerPage.planner" /></span>
        </CardTitle>
        <CardDescription className="text-pencil">
          <T k="auto.studyPlannerPage.setAGoalPerSubject" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 gap-4">
            <TabsTrigger value="subjects" className="min-h-9"><T k="auto.studyPlannerPage.subjects" /></TabsTrigger>
            <TabsTrigger value="calendar" className="min-h-9"><T k="auto.studyPlannerPage.calendar" /></TabsTrigger>
            <TabsTrigger value="statistics" className="min-h-9"><T k="auto.studyPlannerPage.statistics" /></TabsTrigger>
          </TabsList>
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Add a subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubject()}
                className="flex-grow bg-paper"
              />
              <Button onClick={addSubject} className="min-h-11">
                <Plus className="mr-2 h-4 w-4" /> <T k="auto.studyPlannerPage.addSubject" />
              </Button>
            </div>
            {subjects.length > 0 && (
              <div>
                <div className="ledger-row type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                  <span className="flex-1"><T k="auto.studyPlannerPage.subject" /></span>
                  <span className="w-28 sm:w-32"><T k="auto.studyPlannerPage.goalH" /></span>
                  <span className="w-28 sm:w-32"><T k="auto.studyPlannerPage.doneH" /></span>
                  <span className="hidden w-28 sm:block"><T k="auto.studyPlannerPage.progress" /></span>
                  <span className="w-11" aria-hidden="true" />
                </div>
                {subjects.map((subject) => (
                  <div key={subject.id} className="ledger-row last:border-b-0">
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                      {subject.name}
                    </span>
                    <Input
                      type="number"
                      placeholder="Goal"
                      value={subject.goal || ""}
                      onChange={(e) => updateGoal(subject.id, Number(e.target.value))}
                      className="type-data w-28 bg-paper sm:w-32"
                    />
                    <Input
                      type="number"
                      placeholder="Done"
                      value={subject.progress || ""}
                      onChange={(e) => updateProgress(subject.id, Number(e.target.value))}
                      className="type-data w-28 bg-paper sm:w-32"
                    />
                    <Progress
                      value={subject.goal > 0 ? (subject.progress / subject.goal) * 100 : 0}
                      className="hidden h-1 w-28 bg-rule sm:block"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubject(subject.id)}
                      className="min-h-11 min-w-11 text-redpen hover:text-redpen"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only"><T k="auto.studyPlannerPage.remove" /> {subject.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="calendar" className="space-y-6">
            <div>
              <p className="type-data mb-3 text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.studyPlannerPage.logAStudySession" />
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium"><T k="auto.studyPlannerPage.date" /></Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="type-data mt-1 bg-paper"
                  />
                </div>
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium"><T k="auto.studyPlannerPage.subject" /></Label>
                  <Select onValueChange={(value) => setSelectedSubject(Number(value))}>
                    <SelectTrigger className="mt-1 min-h-11">
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
                  <Label htmlFor="duration" className="text-sm font-medium"><T k="auto.studyPlannerPage.durationHours" /></Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Hours studied"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="type-data mt-1 bg-paper"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addStudySession} className="min-h-11 w-full">
                    <T k="auto.studyPlannerPage.logSession" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="counterfoil pt-4">
              <p className="type-data mb-1 text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.studyPlannerPage.upcomingSessions" />
              </p>
              <div>
                {studySessions
                  .filter((session) => new Date(session.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((session) => (
                    <div key={session.id} className="ledger-row last:border-b-0">
                      <span className="min-w-0 flex-1 truncate font-medium text-ink">
                        {subjects.find((s) => s.id === session.subjectId)?.name}
                      </span>
                      <span className="type-data text-sm text-pencil">{session.date}</span>
                      <span className="type-data w-16 text-right text-sm text-ink">
                        {session.duration}<span className="text-pencil"> h</span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="statistics" className="space-y-6">
            <div>
              <p className="type-data mb-2 text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.studyPlannerPage.hoursRegister" />
              </p>
              {/* One summary line, not stat tiles */}
              <p className="type-data text-sm text-ink">
                {averageProgress.toFixed(1)}%{" "}
                <span className="text-pencil"><T k="auto.studyPlannerPage.averageProgress" /></span> · {totalStudyTime}{" "}
                <span className="text-pencil"><T k="auto.studyPlannerPage.hoursLogged" /></span>
                {subjectWithMostTime.name && (
                  <>
                    {" "}· <span className="text-pencil"><T k="auto.studyPlannerPage.mostStudied" /></span>{" "}
                    {subjectWithMostTime.name}{" "}
                    <span className="text-pencil">({subjectWithMostTime.time} h)</span>
                  </>
                )}
              </p>
              <Progress value={averageProgress} className="mt-3 h-1 w-full bg-rule" />
            </div>
            <div className="counterfoil pt-4">
              <p className="type-data mb-1 text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.studyPlannerPage.subjectProgress" />
              </p>
              <div>
                {subjectsWithProgress.map((subject) => (
                  <div key={subject.id} className="ledger-row flex-wrap gap-y-2 last:border-b-0">
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                      {subject.name}
                    </span>
                    <Progress
                      value={subject.goal > 0 ? (subject.progress / subject.goal) * 100 : 0}
                      className="h-1 w-24 bg-rule sm:w-40"
                    />
                    <span className="type-data w-28 text-right text-sm text-ink">
                      {subject.progress}
                      <span className="text-pencil"> / {subject.goal} h</span>
                    </span>
                    <span className="type-data hidden w-24 text-right text-sm text-pencil sm:block">
                      {subject.totalTime} <T k="auto.studyPlannerPage.hTotal" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
