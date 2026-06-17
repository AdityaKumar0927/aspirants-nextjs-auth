"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

import ExamSetup from "./exam-setup"
import ExamRunner from "./ExamRunner"

import { QuestionType, normalizeQuestion } from "@/lib/exam-helpers"

/**
 * The global Mock Exam: pick exam/year/topics/etc., fetch the matching paper
 * from /api/questions, then hand the normalized questions to the shared
 * <ExamRunner/> (timer, navigation, grading, results). The same runner powers
 * the private my-banks exam.
 */
export default function MockExam() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // User selections (kept for the masthead labels)
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedYearKey, setSelectedYearKey] = useState("")
  const [examTime, setExamTime] = useState<number>(60)
  const [numQuestions, setNumQuestions] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  // Once fetched, the attempt is active and <ExamRunner/> takes over.
  const [examQuestions, setExamQuestions] = useState<QuestionType[] | null>(null)

  async function handleStartExam(params: {
    exam: string
    year: number
    yearKey?: string
    examTime?: number
    skipCompleted?: boolean
    difficulty?: string
    selectedTopics?: string[]
    numQuestions?: number
  }) {
    const {
      exam,
      year,
      yearKey = "",
      examTime: requestedTime = 60,
      skipCompleted = false,
      difficulty,
      selectedTopics = [],
      numQuestions: requestedCount = 0,
    } = params

    setIsLoading(true)

    try {
      // Page through ALL matching questions. The API caps pageSize at 200, so a
      // single pageSize=9999 request silently truncated long papers to 200.
      const baseParams = new URLSearchParams()
      baseParams.set("exam", exam)
      baseParams.set("year", String(year))
      if (yearKey) baseParams.set("yearKey", yearKey)
      if (selectedTopics.length > 0) baseParams.set("topic", selectedTopics.join(","))
      if (difficulty) baseParams.set("difficulty", difficulty)

      const PAGE_SIZE = 200
      const MAX_PAGES = 50 // safety cap (10k questions)
      const raw: any[] = []
      let total = Infinity
      for (let page = 1; page <= MAX_PAGES && raw.length < total; page++) {
        const p = new URLSearchParams(baseParams)
        p.set("page", String(page))
        p.set("pageSize", String(PAGE_SIZE))
        const res = await fetch(`/api/questions?${p.toString()}`)
        if (!res.ok) throw new Error("Failed to fetch questions.")
        const data = await res.json()
        total = data.totalCount ?? (data.data?.length ?? 0)
        const batch = data.data ?? []
        raw.push(...batch)
        if (batch.length < PAGE_SIZE) break
      }

      let questions: QuestionType[] = raw.map(normalizeQuestion)

      // Skip questions the user has already completed (per-user UserProgress).
      if (skipCompleted) {
        try {
          const pr = await fetch("/api/user-progress")
          if (pr.ok) {
            const progress = await pr.json()
            const done = new Set<string>(
              (Array.isArray(progress) ? progress : [])
                .filter((x: any) => x?.completed)
                .map((x: any) => String(x.questionId))
            )
            questions = questions.filter((q) => !done.has(String(q.questionId ?? q.id)))
          }
        } catch {
          /* progress is best-effort; ignore and keep all */
        }
      }

      if (!questions.length) {
        toast({
          title: "No questions found",
          description: "No matches — try a different exam, year, or filters.",
          variant: "destructive",
        })
        return
      }

      // Honor the requested count: randomly sample when fewer than available.
      if (requestedCount > 0 && requestedCount < questions.length) {
        for (let i = questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[questions[i], questions[j]] = [questions[j], questions[i]]
        }
        questions = questions.slice(0, requestedCount)
      }

      setSelectedExam(exam)
      setSelectedYear(year)
      setSelectedYearKey(yearKey)
      setExamTime(requestedTime)
      setNumQuestions(questions.length)
      setExamQuestions(questions)
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  function onStartNewExam() {
    setExamQuestions(null)
    setSelectedExam("")
    setSelectedYear(null)
    setSelectedYearKey("")
    setExamTime(60)
    setNumQuestions(0)
  }

  function exitExam() {
    if (window.confirm("Exit the exam? This attempt won't be saved.")) {
      setExamQuestions(null)
      router.push("/mock-exam")
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!examQuestions ? (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ExamSetup
            onStartExam={handleStartExam}
            isLoading={isLoading}
            currentNumQuestions={numQuestions}
          />
        </motion.div>
      ) : (
        <ExamRunner
          key="runner"
          questions={examQuestions}
          examTimeMinutes={examTime}
          userName={session?.user?.name || "Guest"}
          subject={selectedExam}
          year={String(selectedYear || "")}
          level={selectedYearKey}
          onExit={exitExam}
          onStartNewExam={onStartNewExam}
        />
      )}
    </AnimatePresence>
  )
}
