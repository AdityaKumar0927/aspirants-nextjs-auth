/* ------------------------------------------------------------------
   exam-setup.tsx — pre-exam configuration, in the desk design system.
   A true 3-step sequence: choose exam → year & shift → confirm.
-------------------------------------------------------------------*/
"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, type Transition } from "framer-motion"
import { Play, Check } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

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
import { OmrBubble, PaperEyebrow } from "@/components/desk"

/** Mono step numeral for the setup sequence (this IS a true sequence). */
function StepMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="type-data flex h-6 w-6 flex-none items-center justify-center rounded-full border border-rule text-xs text-pencil"
      >
        {n}
      </span>
      <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
        {label}
      </p>
    </div>
  )
}

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

const transitionProps: Transition = {
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
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-8">
      <PaperEyebrow>Past papers</PaperEyebrow>
      <h1 className="type-display mb-6 mt-1 text-3xl sm:text-4xl">Mock exams</h1>

      <div className="grid gap-6 md:grid-cols-[360px_1fr]">
        {/* LEFT SHEET — the setup sequence ---------------------------- */}
        <div className="paper-sheet space-y-6 p-6">
          {errorMsg && (
            <div
              role="alert"
              className="border-l-2 border-redpen py-1 pl-3 text-sm text-redpen"
            >
              {errorMsg}
            </div>
          )}

          {/* Step 1 — choose exam -----------------------------------*/}
          <div className="space-y-3">
            <StepMark n="1" label="Choose exam" />
            <div className="space-y-2">
              <Label className="text-sm text-pencil">Exam (required)</Label>
              {loadingExams ? (
                <Skeleton height={40} />
              ) : (
                <Select
                  value={selectedExam}
                  onValueChange={(val) => setSelectedExam(val)}
                >
                  <SelectTrigger className="min-h-11 bg-paper">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No exam selected</SelectItem>
                    {exams.map((ex) => (
                      <SelectItem key={ex} value={ex}>
                        {ex}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Step 2 — year & shift ----------------------------------*/}
          <div className="space-y-3">
            <StepMark n="2" label="Year & shift" />
            <div className="space-y-2">
              <Label className="text-sm text-pencil">Year (required)</Label>
              {loadingYears ? (
                <Skeleton height={40} />
              ) : (
                <Select
                  value={selectedYear}
                  onValueChange={(val) => setSelectedYear(val)}
                  disabled={selectedExam === "none"}
                >
                  <SelectTrigger className="min-h-11 bg-paper disabled:opacity-50">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No year selected</SelectItem>
                    {years.map((yr) => (
                      <SelectItem key={yr} value={String(yr)}>
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-pencil">Shift (optional)</Label>
              {loadingShifts ? (
                <Skeleton height={40} />
              ) : (
                <Select
                  value={selectedShift}
                  onValueChange={(val) => setSelectedShift(val)}
                  disabled={selectedYear === "none"}
                >
                  <SelectTrigger className="min-h-11 bg-paper disabled:opacity-50">
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
          </div>

          {/* Step 3 — attempt settings & confirm --------------------*/}
          <div className="space-y-3">
            <StepMark n="3" label="Confirm attempt" />

            <div className="space-y-2">
              <Label className="text-sm text-pencil">Number of questions</Label>
              {loadingCount ? (
                <Skeleton height={40} />
              ) : (
                <Input
                  type="number"
                  className="type-data min-h-11 bg-paper"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-pencil">Difficulty (optional)</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="min-h-11 bg-paper">
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

            <div className="space-y-2">
              <Label className="text-sm text-pencil">Skip completed questions?</Label>
              <div className="flex gap-2">
                {(["yes", "no"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSkipCompleted(val)}
                    className="omr-option min-h-11 w-auto"
                    data-state={skipCompleted === val ? "selected" : undefined}
                    aria-pressed={skipCompleted === val}
                  >
                    <OmrBubble filled={skipCompleted === val}>
                      {val === "yes" ? "Y" : "N"}
                    </OmrBubble>
                    <span className="text-sm capitalize leading-7">{val}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-pencil">Exam time (minutes)</Label>
              <Input
                type="number"
                className="type-data min-h-11 bg-paper"
                value={examTime}
                onChange={(e) => setExamTime(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Start — the counterfoil slip at the foot of the sheet ---*/}
          <div className="counterfoil pt-5">
            <Button
              className="min-h-11 w-full"
              onClick={handleGenerate}
              disabled={disabled || isLoading}
            >
              {isLoading ? "Preparing paper" : "Start exam"}
              {!isLoading && <Play className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* RIGHT SHEET — topics --------------------------------------*/}
        <div className="paper-sheet p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <PaperEyebrow>Syllabus</PaperEyebrow>
              <h2 className="type-display mt-1 text-xl">Topics</h2>
            </div>
            <Button
              variant="ghost"
              className="min-h-11 text-pencil"
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
              <p className="text-sm text-pencil">
                No topics for this selection yet — choose an exam and year first.
              </p>
            ) : (
              <ScrollArea className="max-h-125 pr-1">
                <div className="space-y-1">
                  {topics.map((topic) => {
                    const selected = selectedTopics.includes(topic.id)
                    return (
                      <motion.button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        layout
                        initial={false}
                        transition={transitionProps}
                        aria-pressed={selected}
                        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          selected
                            ? "border-ballpoint bg-secondary text-ballpoint"
                            : "border-transparent text-ink hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {selected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={transitionProps}
                            >
                              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-ballpoint">
                                <Check className="h-3 w-3 text-paper" strokeWidth={3} />
                              </div>
                            </motion.div>
                          )}
                          <span>{topic.name}</span>
                        </div>
                        <span className="type-data flex-none text-xs text-pencil">
                          {topic.questions} questions
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
