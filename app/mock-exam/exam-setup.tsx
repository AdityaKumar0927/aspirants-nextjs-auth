"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Define the exact props this component expects, 
 *  matching what's passed from the parent in mock-exam.tsx */
interface ExamSetupProps {
  exams: string[];
  years: number[];
  shifts: string[];
  selectedExam: string;
  selectedYear: number | null;
  selectedShift: string;
  examTime: number;
  onExamChange: Dispatch<SetStateAction<string>>;
  /** or: onYearChange: (val: string) => void; */
  onYearChange: (val: string) => void;
  onShiftChange: Dispatch<SetStateAction<string>>;
  onExamTimeChange: Dispatch<SetStateAction<number>>;
  onStartExam: () => Promise<void>;
}

/** 
 * Default export must match the import name used in mock-exam.tsx
 * so that <ExamSetup ... /> works correctly.
 */
export default function ExamSetup({
  exams,
  years,
  shifts,
  selectedExam,
  selectedYear,
  selectedShift,
  examTime,
  onExamChange,
  onYearChange,
  onShiftChange,
  onExamTimeChange,
  onStartExam,
}: ExamSetupProps) {
  // Example local state if you want to show "units" or subtopics, 
  // but this is purely optional and can be removed.
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);

  // Example local data for demonstration (can be removed if not needed).
  const units = [
    {
      id: 0,
      title: "Unit 1: Introduction to Business Management",
      questions: 39,
    },
    {
      id: 1,
      title: "Unit 2: HR Management",
      questions: 34,
    },
    {
      id: 2,
      title: "Unit 3: Financial Management",
      questions: 47,
      subtopics: [
        { title: "3.1 Introduction to finance", questions: 3 },
        { title: "3.2 Sources of finance", questions: 8 },
        // ...
      ],
    },
    // ...
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with your form controls */}
        <div className="w-full md:w-72 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              {/* You can place an icon here */}
            </div>
            <h1 className="text-2xl font-bold">Test Builder</h1>
          </div>

          <div className="space-y-4">
            {/* 1) Exam */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Exam</label>
              <div className="relative">
                <select
                  className="w-full p-2 bg-gray-100 border-none rounded-md text-gray-700 appearance-none pr-8"
                  value={selectedExam}
                  onChange={(e) => onExamChange(e.target.value)}
                >
                  <option value="">-- Select an exam --</option>
                  {exams.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  size={20}
                />
              </div>
            </div>

            {/* 2) Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Year</label>
              <div className="relative">
                <select
                  className="w-full p-2 bg-gray-100 border-none rounded-md text-gray-700 appearance-none pr-8"
                  value={selectedYear ?? ""}
                  onChange={(e) => onYearChange(e.target.value)}
                >
                  <option value="">-- Select a year --</option>
                  {years.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  size={20}
                />
              </div>
            </div>

            {/* 3) Shift (if any) */}
            {shifts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Shift</label>
                <div className="space-y-2">
                  {shifts.map((shiftVal) => (
                    <div key={shiftVal} className="flex items-center">
                      <input
                        type="radio"
                        id={`shift-${shiftVal}`}
                        name="shifts"
                        value={shiftVal}
                        checked={selectedShift === shiftVal}
                        onChange={(e) => onShiftChange(e.target.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`shift-${shiftVal}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {shiftVal}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {shifts.length === 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Shift</label>
                <div className="text-gray-500 text-sm italic">
                  No shifts available. You can still proceed.
                </div>
              </div>
            )}

            {/* 4) Exam time (in minutes) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Exam Time (minutes)
              </label>
              <input
                type="number"
                className="w-full p-2 bg-gray-100 border-none rounded-md text-gray-700"
                value={examTime}
                onChange={(e) => onExamTimeChange(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Start exam button */}
          <button
            onClick={onStartExam}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-sm mt-2"
          >
            Start Exam
          </button>
        </div>

        {/* Main Content (Optional) */}
        <div className="flex-1 border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">All topics</h2>
          </div>

          {/* Example of local “units” with optional subtopics */}
          <div className="space-y-2">
            {units.map((unit) => (
              <div key={unit.id} className="border rounded-lg">
                <button
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50 focus:outline-none"
                  onClick={() =>
                    setExpandedUnit(expandedUnit === unit.id ? null : unit.id)
                  }
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked={false}
                    />
                    <span className="text-left text-sm">{unit.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">
                      {unit.questions} questions
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform text-gray-400 ${
                        expandedUnit === unit.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Show subtopics if expanded */}
                {expandedUnit === unit.id && unit.subtopics && (
                  <div className="px-4 py-2 border-t">
                    {unit.subtopics.map((subtopic, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-2 px-4 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={false}
                          />
                          <span className="text-sm">{subtopic.title}</span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {subtopic.questions} questions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
