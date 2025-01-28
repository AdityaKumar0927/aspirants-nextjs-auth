"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

/** If you want typed topics: */
interface Topic {
  id: number;
  name: string;
  questions: number;
}

/**
 * The parent (mock-exam) calls onStartExam(...) with final picks
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
    selectedTopicIds?: number[];
  }) => void;
}

export default function ExamSetup({ onStartExam }: ExamSetupProps) {
  // -----------------------------------------------
  // 1) Left sidebar states
  // -----------------------------------------------
  const [exams, setExams] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);

  // "none" means no selection
  const [selectedExam, setSelectedExam] = useState("none");
  const [selectedYear, setSelectedYear] = useState("none");
  const [selectedShift, setSelectedShift] = useState("none");

  // Optional fields
  const [examTime, setExamTime] = useState<number>(60);
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState("none");

  // We'll auto-set numQuestions to the total count of matching questions
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // Loading & error states
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Additional loading state for the question count
  const [loadingQuestionCount, setLoadingQuestionCount] = useState(false);

  // -----------------------------------------------
  // 2) Right column: Topics
  // -----------------------------------------------
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  /** Toggle a single topic check */
  function toggleTopic(topicId: number) {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }

  /** Select all or deselect all */
  function handleSelectAllTopics() {
    if (selectedTopicIds.length === topics.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(topics.map((t) => t.id));
    }
  }

  // -----------------------------------------------
  // 3) Helper for fetch
  // -----------------------------------------------
  async function fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return res.json();
  }

  // -----------------------------------------------
  // 4) On mount => fetch distinct exams
  // -----------------------------------------------
  useEffect(() => {
    async function loadExams() {
      try {
        setLoadingExams(true);
        setErrorMsg(null);

        // No exam param => { exams: [...] }
        const data = await fetchJson("/api/exams-and-years");
        setExams(data.exams || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingExams(false);
      }
    }
    loadExams();
  }, []);

  // -----------------------------------------------
  // 5) If user picks exam => fetch years
  // -----------------------------------------------
  useEffect(() => {
    if (selectedExam === "none") {
      // reset
      setYears([]);
      setSelectedYear("none");
      setShifts([]);
      setSelectedShift("none");
      setTopics([]);
      setSelectedTopicIds([]);
      return;
    }

    async function loadYears(exam: string) {
      try {
        setLoadingYears(true);
        setErrorMsg(null);

        setYears([]);
        setSelectedYear("none");
        setShifts([]);
        setSelectedShift("none");
        setTopics([]);
        setSelectedTopicIds([]);

        const data = await fetchJson(`/api/exams-and-years?exam=${exam}`);
        setYears(data.years || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingYears(false);
      }
    }

    loadYears(selectedExam);
  }, [selectedExam]);

  // -----------------------------------------------
  // 6) If exam+year => fetch shifts & topics
  // -----------------------------------------------
  useEffect(() => {
    if (selectedExam === "none" || selectedYear === "none") {
      setShifts([]);
      setSelectedShift("none");
      setTopics([]);
      setSelectedTopicIds([]);
      return;
    }

    async function loadShiftsAndTopics() {
      try {
        setLoadingShifts(true);
        setLoadingTopics(true);
        setErrorMsg(null);

        setShifts([]);
        setSelectedShift("none");
        setTopics([]);
        setSelectedTopicIds([]);

        // A) shifts => from /api/exams-and-years?exam=XYZ&year=YYYY => { shifts: [...] }
        const shiftRes = await fetchJson(
          `/api/exams-and-years?exam=${selectedExam}&year=${selectedYear}`
        );
        setShifts(shiftRes.shifts || []);
        setLoadingShifts(false);

        // B) topics => e.g. /api/topics?exam=XYZ&year=YYYY
        const topicRes = await fetchJson(
          `/api/topics?exam=${selectedExam}&year=${selectedYear}`
        );
        setTopics(topicRes.topics || []);
        setLoadingTopics(false);
      } catch (err: any) {
        setErrorMsg(err.message);
        setLoadingShifts(false);
        setLoadingTopics(false);
      }
    }

    loadShiftsAndTopics();
  }, [selectedExam, selectedYear]);

  // -----------------------------------------------
  // 7) Auto-fetch question count => set default numQuestions
  // -----------------------------------------------
  useEffect(() => {
    if (selectedExam === "none" || selectedYear === "none") {
      setNumQuestions(10);
      return;
    }

    async function loadQuestionCount() {
      try {
        setLoadingQuestionCount(true);

        let url = `/api/questions?exam=${selectedExam}&year=${selectedYear}&page=1&pageSize=1`;
        if (selectedShift !== "none") {
          url += `&shift=${selectedShift}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch question count`);
        const data = await res.json();

        // Our /api/questions route:
        // If skip/take => returns { data: [...], totalCount, currentPage, pageSize }
        let total = 0;
        if (data.totalCount !== undefined) {
          total = data.totalCount;
        } else if (Array.isArray(data)) {
          // fallback if it's just an array
          total = data.length;
        } else if (Array.isArray(data.data)) {
          total = data.data.length;
        }
        setNumQuestions(total > 0 ? total : 10);
      } catch (err) {
        console.error("Error fetching question count:", err);
        setNumQuestions(10);
      } finally {
        setLoadingQuestionCount(false);
      }
    }
    loadQuestionCount();
  }, [selectedExam, selectedYear, selectedShift]);

  // -----------------------------------------------
  // 8) “Generate ⚡12” => calls parent's onStartExam
  // -----------------------------------------------
  function handleStartExam() {
    if (selectedExam === "none") {
      alert("Please pick an exam first.");
      return;
    }
    if (selectedYear === "none") {
      alert("Please pick a year first.");
      return;
    }

    // SHIFT optional
    const shiftVal = selectedShift === "none" ? undefined : selectedShift;
    // difficulty => if "none", interpret as undefined
    const diffVal = difficulty === "none" ? undefined : difficulty;
    // if no topics => all
    const finalTopics =
      selectedTopicIds.length > 0 ? selectedTopicIds : undefined;

    onStartExam({
      exam: selectedExam,
      year: Number(selectedYear),
      shift: shiftVal,
      examTime,
      skipCompleted,
      difficulty: diffVal,
      numQuestions,
      selectedTopicIds: finalTopics,
    });
  }

  // For anchor "Generate" button
  const isDisabled = selectedExam === "none" || selectedYear === "none";

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------
  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDEBAR */}
      <div className="w-[280px] p-4 border-r border-gray-100 space-y-6">
        {/* The new heading at the top */}
        <h1 className="text-5xl font-medium tracking-tight mb-4">Mock Exam</h1>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-2 rounded-md">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1) Exam */}
        <div className="space-y-2">
          <h3 className="text-sm">Exam (required)</h3>
          {loadingExams ? (
            <Skeleton height={40} />
          ) : (
            <Select
              onValueChange={(val) => setSelectedExam(val)}
              value={selectedExam}
            >
              <SelectTrigger className="w-full bg-gray-50 border-0">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No exam selected --</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam} value={exam}>
                    {exam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 2) Year */}
        <div className="space-y-2">
          <h3 className="text-sm">Year (required)</h3>
          {loadingYears ? (
            <Skeleton height={40} />
          ) : (
            <Select
              disabled={selectedExam === "none"}
              onValueChange={(val) => setSelectedYear(val)}
              value={selectedYear}
            >
              <SelectTrigger className="w-full bg-gray-50 border-0 disabled:opacity-50">
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

        {/* 3) Shift */}
        <div className="space-y-2">
          <h3 className="text-sm">Shift (optional)</h3>
          {loadingShifts ? (
            <Skeleton height={40} />
          ) : (
            <Select
              disabled={selectedYear === "none"}
              onValueChange={(val) => setSelectedShift(val)}
              value={selectedShift}
            >
              <SelectTrigger className="w-full bg-gray-50 border-0 disabled:opacity-50">
                <SelectValue placeholder="No shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No shift</SelectItem>
                {shifts.map((sh) => (
                  <SelectItem key={sh} value={sh}>
                    {sh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 4) Number of Questions (auto from question count) */}
        <div className="space-y-2">
          <h3 className="text-sm">Number of Questions</h3>
          {loadingQuestionCount ? (
            <Skeleton height={40} />
          ) : (
            <Input
              type="number"
              className="bg-gray-50 border-0"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value) || 1)}
            />
          )}
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
              <SelectItem value="none">Any</SelectItem>
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

        {/* 8) The anchor “Generate ⚡12” button => user snippet */}
        <a
          href="#_"
          onClick={(e) => {
            e.preventDefault();
            if (isDisabled) return;
            handleStartExam();
          }}
          className={
            "inline-flex items-center justify-center px-4 py-2 text-base font-medium leading-6 text-gray-600 whitespace-no-wrap bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:shadow-none" +
            (isDisabled ? " opacity-50 pointer-events-none" : "")
          }
        >
          Generate ⚡12
        </a>
      </div>

      {/* RIGHT COLUMN => topics */}
      <div className="flex-1 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">All Topics</h2>
          <a
            href="#_"
            onClick={(e) => {
              e.preventDefault();
              handleSelectAllTopics();
            }}
            className="text-[#6B7280] hover:text-[#374151] hover:bg-transparent font-normal"
          >
            {selectedTopicIds.length === topics.length
              ? "Deselect all"
              : "Select all"}
          </a>
        </div>

        {loadingTopics && (
          <div className="space-y-2">
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
          </div>
        )}

        {!loadingTopics && topics.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No topics found for the selected exam/year.
          </p>
        )}

        {!loadingTopics && topics.length > 0 && (
          <div className="space-y-1">
            {topics.map((topic) => {
              const checked = selectedTopicIds.includes(topic.id);
              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 px-2 -mx-2 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`topic-${topic.id}`}
                      className="rounded-sm"
                      checked={checked}
                      onCheckedChange={() => toggleTopic(topic.id)}
                    />
                    <label htmlFor={`topic-${topic.id}`} className="text-sm">
                      {topic.name}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {topic.questions} questions
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
