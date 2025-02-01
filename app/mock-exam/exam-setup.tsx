// File: /app/mock-exam/exam-setup.tsx
"use client"

import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Check, ChevronRight } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

/** If you want typed topics */
interface Topic {
  id: number;
  name: string;
  questions: number;
}

interface ExamSetupProps {
  onStartExam: (params: {
    exam: string;
    year: number;
    shift?: string;
    examTime?: number;
    skipCompleted?: boolean;
    difficulty?: string;
    numQuestions?: number;
    selectedTopics?: string[];
  }) => void;
}

const transitionProps = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

export default function ExamSetup({ onStartExam }: ExamSetupProps) {
  // Left card data
  const [exams, setExams] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);

  // Selections
  const [selectedExam, setSelectedExam] = useState("none");
  const [selectedYear, setSelectedYear] = useState("none");
  const [selectedShift, setSelectedShift] = useState("no-shift");

  const [numQuestions, setNumQuestions] = useState<number>(1800);
  const [difficulty, setDifficulty] = useState("any");
  const [skipCompleted, setSkipCompleted] = useState<"yes" | "no">("no");
  const [examTime, setExamTime] = useState(60);

  // Loading & error
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Right card: topics
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Toggle all topics
  const handleSelectAll = useCallback(() => {
    if (selectedTopics.length === topics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(topics.map((t) => t.id));
    }
  }, [topics, selectedTopics]);

  // Toggle single
  const toggleTopic = useCallback((topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }, []);

  // Helper fetch
  async function fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${url}`);
    }
    return res.json();
  }

  // 1) On mount => load distinct exams
  useEffect(() => {
    async function loadExams() {
      try {
        setLoadingExams(true);
        setErrorMsg(null);

        const r = await fetch("/api/exams-and-years");
        if (!r.ok) throw new Error("Failed to load exams");
        const data = await r.json();
        // data => { exams:[...], years:[...], shifts:[...] (maybe) }
        const examList: string[] = data.exams?.sort((a: string, b: string) =>
          a.localeCompare(b)
        ) || [];
        setExams(examList);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingExams(false);
      }
    }
    loadExams();
  }, []);

  // 2) If exam => load years (descending)
  useEffect(() => {
    if (selectedExam === "none") {
      setYears([]);
      setSelectedYear("none");
      setShifts([]);
      setSelectedShift("no-shift");
      setTopics([]);
      setSelectedTopics([]);
      return;
    }

    async function loadYears(e: string) {
      try {
        setLoadingYears(true);
        setErrorMsg(null);
        const r = await fetch(`/api/exams-and-years?exam=${e}`);
        if (!r.ok) throw new Error("Failed to fetch years");
        const d = await r.json();
        const yrs: number[] =
          d.years?.sort((a: number, b: number) => b - a) || [];
        setYears(yrs);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingYears(false);
      }
    }
    loadYears(selectedExam);
  }, [selectedExam]);

  // 3) If exam+year => load shifts + topics
  useEffect(() => {
    if (selectedExam === "none" || selectedYear === "none") {
      setShifts([]);
      setSelectedShift("no-shift");
      setTopics([]);
      setSelectedTopics([]);
      return;
    }

    async function loadShiftAndTopics() {
      try {
        setLoadingShifts(true);
        setLoadingTopics(true);
        setErrorMsg(null);

        // Shifts
        const shiftRes = await fetch(
          `/api/exams-and-years?exam=${selectedExam}&year=${selectedYear}`
        );
        if (!shiftRes.ok) throw new Error("Failed to load shifts");
        const shiftData = await shiftRes.json();
        const shArr: string[] =
          shiftData.shifts?.sort((a: string, b: string) => a.localeCompare(b)) ||
          [];
        setShifts(shArr);
        setLoadingShifts(false);

        // Topics
        const tRes = await fetch(
          `/api/topics?exam=${selectedExam}&year=${selectedYear}`
        );
        if (!tRes.ok) throw new Error("Failed to load topics");
        const tData = await tRes.json();
        const tArr: Topic[] = tData.topics || [];
        // sort by topic name
        tArr.sort((a, b) => a.name.localeCompare(b.name));
        setTopics(tArr);
        setLoadingTopics(false);
      } catch (err: any) {
        setErrorMsg(err.message);
        setLoadingShifts(false);
        setLoadingTopics(false);
      }
    }
    loadShiftAndTopics();
  }, [selectedExam, selectedYear]);

  // 4) If exam+year => fetch question count => set default numQuestions
  // (like your existing logic)
  useEffect(() => {
    if (selectedExam === "none" || selectedYear === "none") {
      setNumQuestions(1800);
      return;
    }

    async function loadQuestionCount() {
      try {
        setLoadingCount(true);
        const p = new URLSearchParams({
          exam: selectedExam,
          year: selectedYear,
          page: "1",
          pageSize: "1",
        });
        if (selectedShift !== "no-shift") {
          p.set("shift", selectedShift);
        }
        if (skipCompleted === "yes") {
          p.set("skipCompleted", "true");
        }
        if (difficulty !== "any") {
          p.set("difficulty", difficulty);
        }

        const r = await fetch(`/api/questions?${p.toString()}`);
        if (!r.ok) throw new Error("Failed to fetch question count");
        const d = await r.json();

        let total = 1800;
        if (typeof d.totalCount === "number") total = d.totalCount;
        else if (Array.isArray(d)) total = d.length;
        else if (Array.isArray(d.data)) total = d.data.length;
        setNumQuestions(total || 1800);
      } catch (err) {
        console.error(err);
        setNumQuestions(1800);
      } finally {
        setLoadingCount(false);
      }
    }
    loadQuestionCount();
  }, [selectedExam, selectedYear, selectedShift, skipCompleted, difficulty]);

  // handle "Generate"
  function handleGenerate() {
    if (selectedExam === "none") {
      alert("Please pick an exam first.");
      return;
    }
    if (selectedYear === "none") {
      alert("Please pick a year first.");
      return;
    }

    onStartExam({
      exam: selectedExam,
      year: Number(selectedYear),
      shift: selectedShift === "no-shift" ? undefined : selectedShift,
      examTime,
      skipCompleted: skipCompleted === "yes",
      difficulty: difficulty === "any" ? undefined : difficulty,
      numQuestions,
      selectedTopics:
        topics.length && selectedTopics.length > 0
          ? topics
              .filter((t) => selectedTopics.includes(t.id))
              .map((t) => t.name)
          : undefined,
    });
  }

  const isDisabled = selectedExam === "none" || selectedYear === "none";

  return (
    <div className="container mx-auto p-6 font-light tracking-tight">
      <h1 className="text-3xl font-medium mb-6">Past Papers</h1>

      <div className="grid gap-6 md:grid-cols-[350px,1fr]">
        {/* LEFT CARD => exam, year, shift, skipCompleted, etc. */}
        <Card className="p-6 space-y-5 border-neutral-200">
          {errorMsg && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {errorMsg}
            </div>
          )}

          {/* 1) Exam */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Exam (required)</Label>
            {loadingExams ? (
              <Skeleton height={40} />
            ) : (
              <Select
                value={selectedExam}
                onValueChange={(val) => setSelectedExam(val)}
              >
                <SelectTrigger className="bg-white border-neutral-200">
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

          {/* 2) Year */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Year (required)</Label>
            {loadingYears ? (
              <Skeleton height={40} />
            ) : (
              <Select
                value={selectedYear}
                onValueChange={(val) => setSelectedYear(val)}
                disabled={selectedExam === "none"}
              >
                <SelectTrigger className="bg-white border-neutral-200 disabled:opacity-50">
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

          {/* 3) Shift => "no-shift" default */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Shift (optional)</Label>
            {loadingShifts ? (
              <Skeleton height={40} />
            ) : (
              <Select
                value={selectedShift}
                onValueChange={(val) => setSelectedShift(val)}
                disabled={selectedYear === "none"}
              >
                <SelectTrigger className="bg-white border-neutral-200 disabled:opacity-50">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-shift">No shift</SelectItem>
                  {shifts.map((sh) => (
                    <SelectItem key={sh} value={sh}>
                      {sh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 4) Number of Q */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Number of Questions</Label>
            {loadingCount ? (
              <Skeleton height={40} />
            ) : (
              <Input
                type="number"
                className="bg-white border-neutral-200"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value) || 1)}
              />
            )}
          </div>

          {/* 5) Difficulty */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Difficulty (optional)</Label>
            <Select
              value={difficulty}
              onValueChange={setDifficulty}
            >
              <SelectTrigger className="bg-white border-neutral-200">
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

          {/* 6) Skip completed? */}
          <div className="space-y-3">
            <Label className="text-sm text-neutral-600">Skip completed?</Label>
            <div className="flex gap-4">
              {(["yes", "no"] as const).map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSkipCompleted(val)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                      skipCompleted === val
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-neutral-300 hover:border-blue-400"
                    }`}
                  >
                    {skipCompleted === val && <Check className="w-3 h-3" />}
                  </button>
                  <Label className="text-sm capitalize">{val}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* 7) Exam Time */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Exam Time (minutes)</Label>
            <Input
              type="number"
              className="bg-white border-neutral-200"
              value={examTime}
              onChange={(e) => setExamTime(Number(e.target.value))}
            />
          </div>

          {/* 8) Generate button */}
          <Button
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300"
            variant="outline"
            onClick={handleGenerate}
            disabled={isDisabled}
          >
            Generate
            <Play className="ml-2 h-4 w-4" />
          </Button>
        </Card>

        {/* RIGHT => topics => from /api/topics */}
        <Card className="p-6 border-neutral-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-neutral-800">All Topics</h2>
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
              <p className="text-sm text-neutral-500 italic">
                No topics found for the selected exam/year.
              </p>
            ) : (
              <ScrollArea className="max-h-[500px] pr-1">
                <div className="space-y-1">
                  {topics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <motion.button
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        layout
                        initial={false}
                        animate={{
                          backgroundColor: isSelected ? "#e6f7ff" : "transparent",
                        }}
                        whileHover={{
                          backgroundColor: isSelected
                            ? "#cceeff"
                            : "rgba(229, 231, 235, 0.5)",
                        }}
                        whileTap={{
                          backgroundColor: isSelected
                            ? "#b3e6ff"
                            : "rgba(229, 231, 235, 0.8)",
                        }}
                        transition={{
                          ...transitionProps,
                          backgroundColor: { duration: 0.1 },
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium
                          tracking-tight transition-colors
                          ${
                            isSelected
                              ? "text-blue-600 ring-1 ring-blue-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          {isSelected && (
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
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </Card>
      </div>
    </div>
  );
}
