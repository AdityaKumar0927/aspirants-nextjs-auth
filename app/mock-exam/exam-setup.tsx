"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, AlertTriangle, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/**
 * The parent calls onStartExam(...) with final picks.
 */
interface ExamSetupProps {
  onStartExam: (params: {
    exam: string;
    year: number;
    shift?: string;
    examTime?: number;
    skipCompleted?: boolean;
    difficulty?: string;
    numQuestions?: number;
    // ...any other optional fields you like
  }) => void;
}

export default function ExamSetup({ onStartExam }: ExamSetupProps) {
  // ----------------------------------------------------------------
  // 1) States for dynamic fetching
  // ----------------------------------------------------------------
  const [exams, setExams] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState("none"); // for "no shift"

  // Optional fields
  const [examTime, setExamTime] = useState<number>(60);
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // States for loading & error
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If you want to show example topics in the right column, you can do so,
  // but we'll just demonstrate the two-column layout.

  // ----------------------------------------------------------------
  // 2) Helper for fetch
  // ----------------------------------------------------------------
  async function fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${url}`);
    }
    return res.json();
  }

  // ----------------------------------------------------------------
  // 3) On mount => fetch distinct "exams" (no query)
  // ----------------------------------------------------------------
  useEffect(() => {
    async function loadExams() {
      try {
        setLoadingExams(true);
        setErrorMsg(null);
        const data = await fetchJson("/api/exams-and-years");
        // data => { exams: ["ExamA","ExamB"] }
        setExams(data.exams || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingExams(false);
      }
    }
    loadExams();
  }, []);

  // ----------------------------------------------------------------
  // 4) If user picks exam => fetch years
  // ----------------------------------------------------------------
  useEffect(() => {
    async function loadYears(exam: string) {
      try {
        setLoadingYears(true);
        setErrorMsg(null);

        // reset older data
        setYears([]);
        setSelectedYear(null);
        setShifts([]);
        setSelectedShift("none");

        const data = await fetchJson(`/api/exams-and-years?exam=${exam}`);
        // data => { years: [2020,2021,...] }
        setYears(data.years || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingYears(false);
      }
    }

    if (selectedExam) {
      loadYears(selectedExam);
    } else {
      // reset if exam cleared
      setYears([]);
      setSelectedYear(null);
      setShifts([]);
      setSelectedShift("none");
    }
  }, [selectedExam]);

  // ----------------------------------------------------------------
  // 5) If user picks exam + year => fetch shifts
  // ----------------------------------------------------------------
  useEffect(() => {
    async function loadShifts(exam: string, year: number) {
      try {
        setLoadingShifts(true);
        setErrorMsg(null);
        setShifts([]);
        setSelectedShift("none");

        const data = await fetchJson(
          `/api/exams-and-years?exam=${exam}&year=${year}`
        );
        // data => { shifts: [...] }
        setShifts(data.shifts || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingShifts(false);
      }
    }

    if (selectedExam && selectedYear !== null) {
      loadShifts(selectedExam, selectedYear);
    } else {
      setShifts([]);
      setSelectedShift("none");
    }
  }, [selectedExam, selectedYear]);

  // ----------------------------------------------------------------
  // 6) “Start Exam”
  // ----------------------------------------------------------------
  function handleStartExam() {
    if (!selectedExam) {
      alert("Please pick an exam first.");
      return;
    }
    if (!selectedYear) {
      alert("Please pick a year first.");
      return;
    }
    // SHIFT is optional, so "none" => undefined
    onStartExam({
      exam: selectedExam,
      year: selectedYear,
      shift: selectedShift === "none" ? undefined : selectedShift,
      examTime,
      skipCompleted,
      difficulty: difficulty || undefined,
      numQuestions,
    });
  }

  // ----------------------------------------------------------------
  // 7) Render two columns (like the sample)
  // ----------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-[280px] p-4 border-r border-gray-100 space-y-6">
        {/* Possibly show an error banner if needed */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-2 rounded-md">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1) Exam */}
        <div className="space-y-2">
          <h3 className="text-sm">Exam (required)</h3>
          <Select
            onValueChange={(val) => setSelectedExam(val)}
            value={selectedExam}
          >
            <SelectTrigger className="w-full bg-gray-50 border-0">
              <SelectValue placeholder="Select an exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam} value={exam}>
                  {exam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2) Year */}
        <div className="space-y-2">
          <h3 className="text-sm">Year (required)</h3>
          <Select
            onValueChange={(val) => setSelectedYear(Number(val))}
            value={selectedYear ? String(selectedYear) : ""}
            disabled={!selectedExam}
          >
            <SelectTrigger className="w-full bg-gray-50 border-0 disabled:opacity-50">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3) Shift */}
        <div className="space-y-2">
          <h3 className="text-sm">Shift (optional)</h3>
          <Select
            onValueChange={(val) => setSelectedShift(val)}
            value={selectedShift}
            disabled={!selectedYear}
          >
            <SelectTrigger className="w-full bg-gray-50 border-0 disabled:opacity-50">
              <SelectValue placeholder="No shift" />
            </SelectTrigger>
            <SelectContent>
              {/* "none" means no shift */}
              <SelectItem value="none">No shift</SelectItem>

              {shifts.map((sh) => (
                <SelectItem key={sh} value={sh}>
                  {sh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4) Number of questions */}
        <div className="space-y-2">
          <h3 className="text-sm">Number of Questions (optional)</h3>
          <Input
            type="number"
            className="bg-gray-50 border-0"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value) || 10)}
          />
        </div>

        {/* 5) Difficulty */}
        <div className="space-y-2">
          <h3 className="text-sm">Difficulty (optional)</h3>
          <Select
            onValueChange={setDifficulty}
            value={difficulty}
          >
            <SelectTrigger className="w-full bg-gray-50 border-0">
              <SelectValue placeholder="Any difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 6) Skip completed */}
        <div className="space-y-2">
          <h3 className="text-sm">Skip completed?</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <RadioGroup
              defaultValue={skipCompleted ? "yes" : "no"}
              onValueChange={(val) => setSkipCompleted(val === "yes")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <label htmlFor="yes" className="text-sm">
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <label htmlFor="no" className="text-sm">
                  No
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* 7) Exam Time */}
        <div className="space-y-2">
          <h3 className="text-sm">Exam Time (minutes)</h3>
          <Input
            type="number"
            className="bg-gray-50 border-0"
            value={examTime}
            onChange={(e) => setExamTime(Number(e.target.value))}
          />
        </div>

        <Button
          onClick={handleStartExam}
          className="w-full bg-[#9333EA] hover:bg-[#7E22CE] text-white font-normal mt-3"
          disabled={!selectedExam || !selectedYear}
        >
          Generate ⚡ 12
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Right Content - Example or Topics */}
      <div className="flex-1 px-6 py-5">
        {/* If you want to display other data or a "topics" list, do so here. */}
        <h2 className="text-lg font-medium">All topics</h2>
        <p className="text-sm text-gray-500 mt-2">
          (Optional content area. Add your own logic or UI here.)
        </p>
      </div>
    </div>
  );
}
