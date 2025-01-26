"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

/**
 * A simplified setup component where the user only picks
 * - Exam (e.g. "jee-main", "jee-advanced", etc.)
 * - Year (e.g. "2023", "2022", etc.)
 * We then auto-assign examTime (in minutes) based on the exam.
 */
interface ExamSetupProps {
  exams: string[]
  years: string[]
  selectedExam: string
  selectedYear: string
  examTime: number
  onExamChange: (exam: string) => void
  onYearChange: (year: string) => void
  onExamTimeChange: (time: number) => void
  onStartExam: () => void
}

export default function ExamSetup({
  exams,
  years,
  selectedExam,
  selectedYear,
  examTime,
  onExamChange,
  onYearChange,
  onExamTimeChange,
  onStartExam,
}: ExamSetupProps) {
  // Whenever the user picks a new exam, automatically change examTime
  function handleExamSelection(exam: string) {
    onExamChange(exam)

    // Default exam time
    let newTime = 60 // fallback = 60 minutes

    // Example logic: if user picks "jee-main", we do 180 min, "jee-advanced" = 360 min, etc.
    if (exam === "jee-main") {
      newTime = 180
    } else if (exam === "jee-advanced") {
      newTime = 360
    }

    onExamTimeChange(newTime)
  }

  return (
    <Card className="max-w-3xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Mock Exam Setup</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Exam Select */}
        <div>
          <Label>Select Exam</Label>
          <Select value={selectedExam} onValueChange={handleExamSelection}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Pick an exam" />
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

        {/* Year Select */}
        <div>
          <Label>Select Year</Label>
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Pick a year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((yr) => (
                <SelectItem key={yr} value={yr}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exam Duration (optional override) */}
        <div>
          <Label>Exam Duration (minutes)</Label>
          <p className="text-sm text-muted-foreground">
            Automatically chosen from exam type, but you can override it if needed.
          </p>
          <input
            type="number"
            min={1}
            className="border border-gray-300 mt-1 rounded-md p-2 w-full"
            value={examTime}
            onChange={(e) => onExamTimeChange(parseInt(e.target.value) || 60)}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={onStartExam}>Start Exam</Button>
      </CardFooter>
    </Card>
  )
}
