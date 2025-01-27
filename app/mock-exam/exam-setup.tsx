import React from "react"

interface ExamSetupProps {
  exams: string[]
  years: number[]
  shifts: string[]
  selectedExam: string
  selectedYear: number | null
  selectedShift: string
  examTime: number
  onExamChange: (val: string) => void
  onYearChange: (val: number) => void
  onShiftChange: (val: string) => void
  onExamTimeChange: (val: number) => void
  onStartExam: () => void
}

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
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mock Exam Setup</h1>

      <div className="flex flex-col space-y-4">
        {/* 1) Exam Dropdown */}
        <div>
          <label className="block mb-1 text-sm font-medium">Select Exam:</label>
          <select
            className="border p-2 w-full"
            value={selectedExam}
            onChange={(e) => onExamChange(e.target.value)}
          >
            <option value="">-- Choose an exam --</option>
            {exams.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
        </div>

        {/* 2) Year Dropdown */}
        <div>
          <label className="block mb-1 text-sm font-medium">Select Year:</label>
          <select
            className="border p-2 w-full"
            value={selectedYear ?? ""}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            <option value="">-- Choose a year --</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* 3) Shift Dropdown */}
        <div>
          <label className="block mb-1 text-sm font-medium">Select Shift:</label>
          <select
            className="border p-2 w-full"
            value={selectedShift}
            onChange={(e) => onShiftChange(e.target.value)}
          >
            <option value="">-- Choose a shift --</option>
            {shifts.map((shift) => (
              <option key={shift} value={shift}>
                {shift}
              </option>
            ))}
          </select>
        </div>

        {/* 4) Time in minutes */}
        <div>
          <label className="block mb-1 text-sm font-medium">Exam Duration (minutes):</label>
          <input
            type="number"
            min={1}
            className="border p-2 w-full"
            value={examTime}
            onChange={(e) => onExamTimeChange(Number(e.target.value))}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={onStartExam}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Start Exam
        </button>
      </div>
    </div>
  )
}
