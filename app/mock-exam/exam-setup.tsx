/* ------------------------------------------------------------------
   exam-setup.tsx  –  light-only version
-------------------------------------------------------------------*/
"use client"

import React, { useEffect, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Play, Check, ChevronRight } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

/* ---------------------------------------------------------------
   types & helpers
---------------------------------------------------------------- */
interface Topic {
  id:        number
  name:      string
  questions: number
}

interface ExamSetupProps {
  onStartExam: (params: {
    exam:            string
    year:            number
    yearKey?:        string
    examTime?:       number
    skipCompleted?:  boolean
    difficulty?:     string
    numQuestions?:   number
    selectedTopics?: string[]
  }) => void

  isLoading?:          boolean
  currentNumQuestions?: number
}

const SHIFT_PLACEHOLDER = "select-shift"

const transitionProps = {
  type:       "spring",
  stiffness:  500,
  damping:    30,
  mass:       0.5,
}

/* ===============================================================
   main component
================================================================ */
export default function ExamSetup({
  onStartExam,
  isLoading = false,
  currentNumQuestions = 0,
}: ExamSetupProps) {
  /* ---------- collections ---------- */
  const [exams,  setExams]  = useState<string[]>([])
  const [years,  setYears]  = useState<number[]>([])
  const [shifts, setShifts] = useState<string[]>([])

  /* ---------- selections ---------- */
  const [selectedExam,  setSelectedExam]  = useState("none")
  const [selectedYear,  setSelectedYear]  = useState("none")
  const [selectedShift, setSelectedShift] = useState<string>(SHIFT_PLACEHOLDER)

  const [numQuestions,  setNumQuestions]  = useState<string>("")
  const [difficulty,    setDifficulty]    = useState("any")
  const [skipCompleted, setSkipCompleted] = useState<"yes" | "no">("no")
  const [examTime,      setExamTime]      = useState(60)

  /* ---------- topics ---------- */
  const [topics,          setTopics]          = useState<Topic[]>([])
  const [selectedTopics,  setSelectedTopics]  = useState<number[]>([])
  const [loadingTopics,   setLoadingTopics]   = useState(false)

  /* ---------- loading & error ---------- */
  const [loadingExams,  setLoadingExams]  = useState(false)
  const [loadingYears,  setLoadingYears]  = useState(false)
  const [loadingShifts, setLoadingShifts] = useState(false)
  const [loadingCount,  setLoadingCount]  = useState(false)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)

  /* =============================================================
     effects – load exam/year/shift/topic data
  ============================================================= */
  /* 1) on mount: load distinct exams --------------------------------*/
  useEffect(() => {
    async function loadExams() {
      try {
        setLoadingExams(true)
        setErrorMsg(null)

        const r = await fetch("/api/exams-and-years")
        if (!r.ok) throw new Error("Failed to load exams")
        const data = await r.json()

        const list: string[] =
          data.exams?.sort((a: string, b: string) => a.localeCompare(b)) || []
        setExams(list)
      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setLoadingExams(false)
      }
    }
    loadExams()
  }, [])

  /* 2) if exam selected: load years ---------------------------------*/
  useEffect(() => {
    if (selectedExam === "none") {
      setYears([]); setSelectedYear("none")
      setShifts([]); setSelectedShift(SHIFT_PLACEHOLDER)
      setTopics([]); setSelectedTopics([])
      return
    }

    async function loadYears(exam: string) {
      try {
        setLoadingYears(true); setErrorMsg(null)

        const r = await fetch(`/api/exams-and-years?exam=${exam}`)
        if (!r.ok) throw new Error("Failed to fetch years")
        const d = await r.json()

        const yrs: number[] = d.years?.sort((a: number, b: number) => b - a) || []
        setYears(yrs)
      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setLoadingYears(false)
      }
    }
    loadYears(selectedExam)
  }, [selectedExam])

  /* 3) exam+year: load shifts and topics ----------------------------*/
  useEffect(() => {
    if (selectedExam === "none" || selectedYear === "none") {
      setShifts([]); setSelectedShift(SHIFT_PLACEHOLDER)
      setTopics([]); setSelectedTopics([])
      return
    }

    async function loadShiftAndTopics() {
      try {
        setLoadingShifts(true); setLoadingTopics(true); setErrorMsg(null)

        /* shifts */
        const sRes = await fetch(
          `/api/exams-and-years?exam=${selectedExam}&year=${selectedYear}`
        )
        if (!sRes.ok) throw new Error("Failed to load shifts")
        const sData = await sRes.json()
        const list: string[] =
          sData.shifts?.sort((a: string, b: string) => a.localeCompare(b)) || []

        if (list.length === 0) {
          setShifts([]); setSelectedShift("no-shift")
        } else {
          setShifts(list); setSelectedShift(SHIFT_PLACEHOLDER)
        }
        setLoadingShifts(false)

        /* topics */
        const tRes = await fetch(
          `/api/topics?exam=${selectedExam}&year=${selectedYear}`
        )
        if (!tRes.ok) throw new Error("Failed to load topics")
        const tData = await tRes.json()

        const tArr: Topic[] = (tData.topics || []).sort((a: Topic, b: Topic) =>
          a.name.localeCompare(b.name)
        )
        setTopics(tArr); setLoadingTopics(false)
      } catch (err: any) {
        setErrorMsg(err.message)
        setLoadingShifts(false); setLoadingTopics(false)
      }
    }
    loadShiftAndTopics()
  }, [selectedExam, selectedYear])

  useEffect(() => {
    if (selectedExam === "none" || selectedYear === "none") {
      setNumQuestions(""); return
    }

    async function loadCount() {
      setLoadingCount(true)
      try {
        const p = new URLSearchParams({
          exam:     selectedExam,
          year:     String(selectedYear),
          page:     "1",
          pageSize: "1",
        })
        if (selectedShift !== "no-shift" && selectedShift !== SHIFT_PLACEHOLDER)
          p.set("yearKey", selectedShift)
        if (skipCompleted === "yes") p.set("skipCompleted", "true")
        if (difficulty !== "any")    p.set("difficulty", difficulty)

        const r = await fetch(`/api/questions?${p.toString()}`)
        if (!r.ok) throw new Error("Failed to fetch question count")
        const d = await r.json()

        const total =
          typeof d.totalCount === "number"
            ? d.totalCount
            : Array.isArray(d.data)
            ? d.data.length
            : 0

        setNumQuestions(String(total))
      } catch {
        setNumQuestions("")
      } finally {
        setLoadingCount(false)
      }
    }
    loadCount()
  }, [selectedExam, selectedYear, selectedShift, skipCompleted, difficulty])

  /* =============================================================
     topic selection helpers
  ============================================================= */
  const toggleTopic = useCallback((id: number) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedTopics((prev) =>
      prev.length === topics.length ? [] : topics.map((t) => t.id)
    )
  }, [topics, selectedTopics])

  /* =============================================================
     start-exam click
  ============================================================= */
  function handleGenerate() {
    if (selectedExam === "none") { alert("Please pick an exam first."); return }
    if (selectedYear === "none") { alert("Please pick a year first."); return }

    const parsed = parseInt(numQuestions, 10) || 0

    onStartExam({
      exam:  selectedExam,
      year:  Number(selectedYear),
      yearKey:
        selectedShift !== "no-shift" && selectedShift !== SHIFT_PLACEHOLDER
          ? selectedShift
          : undefined,
      examTime,
      skipCompleted: skipCompleted === "yes",
      difficulty:   difficulty === "any" ? undefined : difficulty,
      numQuestions: parsed > 0 ? parsed : undefined,
      selectedTopics:
        topics.length && selectedTopics.length
          ? topics.filter((t) => selectedTopics.includes(t.id)).map((t) => t.name)
          : undefined,
    })
  }

  const disabled = selectedExam === "none" || selectedYear === "none"

  /* =============================================================
     render
  ============================================================= */
  return (
    <div className="container mx-auto p-16 font-light tracking-tight">
      <h1 className="text-3xl font-medium mb-6">Past Papers</h1>

      <div className="grid gap-6 md:grid-cols-[350px,1fr]">
        {/* LEFT CARD ------------------------------------------------ */}
        <Card className="p-6 space-y-5 border-gray-200">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {errorMsg}
            </div>
          )}

          {/* Exam ----------------------------------------------------*/}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Exam (required)</Label>
            {loadingExams ? (
              <Skeleton height={40} />
            ) : (
              <Select
                value={selectedExam}
                onValueChange={(val) => setSelectedExam(val)}
              >
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No exam selected --</SelectItem>
                  {exams.map((ex) => (
                    <SelectItem key={ex} value={ex}>
                      {ex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Year ----------------------------------------------------*/}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Year (required)</Label>
            {loadingYears ? (
              <Skeleton height={40} />
            ) : (
              <Select
                value={selectedYear}
                onValueChange={(val) => setSelectedYear(val)}
                disabled={selectedExam === "none"}
              >
                <SelectTrigger className="bg-white border-gray-200 disabled:opacity-50">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No year selected --</SelectItem>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Shift ---------------------------------------------------*/}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Shift (optional)</Label>
            {loadingShifts ? (
              <Skeleton height={40} />
            ) : (
              <Select
                value={selectedShift}
                onValueChange={(val) => setSelectedShift(val)}
                disabled={selectedYear === "none"}
              >
                <SelectTrigger className="bg-white border-gray-200 disabled:opacity-50">
                  <SelectValue
                    placeholder={shifts.length === 0 ? "No shift" : "Select shift"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {shifts.length === 0 ? (
                    <SelectItem value="no-shift">No shift</SelectItem>
                  ) : (
                    <>
                      <SelectItem value={SHIFT_PLACEHOLDER} disabled>
                        Select shift
                      </SelectItem>
                      {shifts.map((sh) => (
                        <SelectItem key={sh} value={sh}>
                          {sh}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Number of questions ------------------------------------*/}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Number of Questions</Label>
            {loadingCount ? (
              <Skeleton height={40} />
            ) : (
              <Input
                type="number"
                className="bg-white border-gray-200"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
              />
            )}
          </div>

          {/* Difficulty ---------------------------------------------*/}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Difficulty (optional)</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skip completed -----------------------------------------*/}
          <div className="space-y-3">
            <Label className="text-sm text-gray-600">Skip completed?</Label>
            <div className="flex gap-4">
              {(["yes", "no"] as const).map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSkipCompleted(val)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                      skipCompleted === val
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {skipCompleted === val && <Check className="w-3 h-3" />}
                  </button>
                  <Label className="text-sm capitalize">{val}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Exam time ----------------------------------------------*/}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Exam Time (minutes)</Label>
            <Input
              type="number"
              className="bg-white border-gray-200"
              value={examTime}
              onChange={(e) => setExamTime(Number(e.target.value))}
            />
          </div>

          {/* Start button -------------------------------------------*/}
          <Button
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300"
            variant="outline"
            onClick={handleGenerate}
            disabled={disabled || isLoading}
          >
            {isLoading ? "Loading..." : "Start Exam"}
            {!isLoading && <Play className="ml-2 h-4 w-4" />}
          </Button>
        </Card>

        {/* RIGHT CARD – topics -------------------------------------*/}
        <Card className="p-6 border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-800">All Topics</h2>
            <Button
              variant="ghost"
              className="text-sm font-light text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleSelectAll}
            >
              {selectedTopics.length === topics.length ? "Deselect all" : "Select all"}
            </Button>
          </div>

          <motion.div className="space-y-2" layout transition={transitionProps}>
            {loadingTopics ? (
              <>
                <Skeleton height={24} />
                <Skeleton height={24} />
                <Skeleton height={24} />
                <Skeleton height={24} />
              </>
            ) : topics.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No topics found for the selected exam/year.
              </p>
            ) : (
              <ScrollArea className="max-h-[500px] pr-1">
                <div className="space-y-1">
                  {topics.map((topic) => {
                    const selected = selectedTopics.includes(topic.id)
                    return (
                      <motion.button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        layout
                        initial={false}
                        animate={{
                          backgroundColor: selected ? "#e6f7ff" : "transparent",
                        }}
                        whileHover={{
                          backgroundColor: selected
                            ? "#cceeff"
                            : "rgba(229,231,235,0.5)",
                        }}
                        whileTap={{
                          backgroundColor: selected
                            ? "#b3e6ff"
                            : "rgba(229,231,235,0.8)",
                        }}
                        transition={{
                          ...transitionProps,
                          backgroundColor: { duration: 0.1 },
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium tracking-tight transition-colors ${
                          selected
                            ? "text-blue-600 ring-1 ring-blue-200"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {selected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={transitionProps}
                            >
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-1">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            </motion.div>
                          )}
                          <span>{topic.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-light text-gray-500">
                            {topic.questions} questions
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </Card>
      </div>
    </div>
  )
}
