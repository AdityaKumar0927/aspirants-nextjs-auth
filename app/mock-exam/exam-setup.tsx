"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  BookOpen,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";

/**
 * The parent can pass this callback to receive final (exam, year, shift, time).
 */
interface ProductionExamSetupProps {
  onStartExam: (
    selectedExam: string,
    selectedYear: number,
    selectedShift: string,
    examTime: number
  ) => void;
}

/**
 * A production-ready, step-by-step Past Paper / Mock Exam setup wizard.
 * 1) Fetch exams on mount => user picks an exam
 * 2) Then fetch years => user picks a year
 * 3) Then fetch shifts => user picks a shift
 * 4) Enter exam time => press Start
 *
 * Each step is disabled until the previous selection is made.
 */
export default function ProductionExamSetup({
  onStartExam,
}: ProductionExamSetupProps) {
  // Data arrays
  const [exams, setExams] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);

  // Selections
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState("");

  // Exam time in minutes (default 60)
  const [examTime, setExamTime] = useState<number>(60);

  // Loading states
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Fetch initial exam list on mount.
   */
  useEffect(() => {
    async function fetchExams() {
      try {
        setLoadingExams(true);
        setErrorMsg(null);
        // Example endpoint that returns {exams: string[], years: number[], shifts: string[]}
        // We only need .exams initially
        const res = await fetch("/api/exams-and-years");
        if (!res.ok) {
          throw new Error("Failed to fetch exams.");
        }
        const data = await res.json();
        setExams(data.exams || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingExams(false);
      }
    }
    fetchExams();
  }, []);

  /**
   * Whenever the user selects an exam, fetch the years for that exam.
   */
  useEffect(() => {
    async function fetchYearsForExam(exam: string) {
      try {
        setLoadingYears(true);
        setErrorMsg(null);
        setYears([]);
        setSelectedYear(null);
        setShifts([]);
        setSelectedShift("");

        // e.g. /api/exams-and-years?exam=EXAM_NAME
        const res = await fetch(`/api/exams-and-years?exam=${exam}`);
        if (!res.ok) {
          throw new Error("Failed to fetch years for exam: " + exam);
        }
        const data = await res.json();
        setYears(data.years || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingYears(false);
      }
    }
    if (selectedExam) {
      fetchYearsForExam(selectedExam);
    } else {
      // if user clears exam
      setYears([]);
      setSelectedYear(null);
      setShifts([]);
      setSelectedShift("");
    }
  }, [selectedExam]);

  /**
   * Whenever the user selects a year, fetch shifts for (exam, year).
   */
  useEffect(() => {
    async function fetchShiftsForExamYear(exam: string, year: number) {
      try {
        setLoadingShifts(true);
        setErrorMsg(null);
        setShifts([]);
        setSelectedShift("");

        // e.g. /api/exams-and-years?exam=EXAM_NAME&year=YEAR_NUM
        const res = await fetch(`/api/exams-and-years?exam=${exam}&year=${year}`);
        if (!res.ok) {
          throw new Error("Failed to fetch shifts for exam/year.");
        }
        const data = await res.json();
        setShifts(data.shifts || []);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoadingShifts(false);
      }
    }
    if (selectedExam && selectedYear !== null) {
      fetchShiftsForExamYear(selectedExam, selectedYear);
    } else {
      setShifts([]);
      setSelectedShift("");
    }
  }, [selectedExam, selectedYear]);

  /**
   * Final step: Validate selections and pass them up.
   */
  const handleStartExam = () => {
    if (!selectedExam) {
      alert("Please select an exam.");
      return;
    }
    if (!selectedYear) {
      alert("Please select a year.");
      return;
    }
    if (shifts.length > 0 && !selectedShift) {
      alert("Please select a shift (paper).");
      return;
    }
    onStartExam(selectedExam, selectedYear, selectedShift, examTime);
  };

  /**
   * Helper to show a spinner or a dropdown arrow
   */
  const renderDropdownIcon = (loading: boolean) => {
    if (loading) {
      return (
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3 top-3" />
      );
    }
    return (
      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
    );
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white shadow-md rounded-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold leading-none">
            Start a Practice Exam
          </h1>
        </div>

        {/* Error message (if any) */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-2 rounded-md mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Exam */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            1. Select Exam
          </label>
          <div className="relative">
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="">-- Choose an exam --</option>
              {exams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
            {renderDropdownIcon(loadingExams)}
          </div>
        </div>

        {/* Step 2: Year */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            2. Select Year
          </label>
          <div className="relative">
            <select
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={!selectedExam}
            >
              <option value="">-- Choose a year --</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            {renderDropdownIcon(loadingYears)}
          </div>
        </div>

        {/* Step 3: Shift */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            3. Select Shift
          </label>
          {shifts.length === 0 ? (
            <>
              {loadingShifts ? (
                <p className="text-sm text-gray-500 italic">Loading shifts...</p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No shifts available. You can still proceed.
                </p>
              )}
            </>
          ) : (
            <div className="relative">
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                disabled={!selectedYear}
              >
                <option value="">-- Choose a shift --</option>
                {shifts.map((shiftVal) => (
                  <option key={shiftVal} value={shiftVal}>
                    {shiftVal}
                  </option>
                ))}
              </select>
              {renderDropdownIcon(loadingShifts)}
            </div>
          )}
        </div>

        {/* Step 4: Exam Time */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            4. Exam Time (minutes)
          </label>
          <input
            type="number"
            min={1}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            value={examTime}
            onChange={(e) => setExamTime(Number(e.target.value))}
          />
        </div>

        {/* Button: Start Exam */}
        <button
          onClick={handleStartExam}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          disabled={
            !selectedExam ||
            !selectedYear ||
            (shifts.length > 0 && !selectedShift)
          }
        >
          Start Exam
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
