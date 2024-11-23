import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Pencil } from 'lucide-react'
import { RainbowButton } from "@/components/magicui/rainbow-button"

interface ExamSetupProps {
  exams: string[]
  subjects: string[]
  years: string[]
  selectedExam: string
  selectedSubject: string
  selectedYear: string
  selectedLevel: string
  numberOfQuestions: number
  skipCompleted: boolean
  examTime: number
  examMode: "past" | "custom"
  onExamModeChange: (mode: "past" | "custom") => void
  onExamChange: (exam: string) => void
  onSubjectChange: (subject: string) => void
  onYearChange: (year: string) => void
  onLevelChange: (level: string) => void
  onNumberOfQuestionsChange: (num: number) => void
  onSkipCompletedChange: (skip: boolean) => void
  onExamTimeChange: (time: number) => void
  onStartExam: () => void
}

const ExamSetup: React.FC<ExamSetupProps> = ({
  exams,
  subjects,
  years,
  selectedExam,
  selectedSubject,
  selectedYear,
  selectedLevel,
  numberOfQuestions,
  skipCompleted,
  examTime,
  examMode,
  onExamModeChange,
  onExamChange,
  onSubjectChange,
  onYearChange,
  onLevelChange,
  onNumberOfQuestionsChange,
  onSkipCompletedChange,
  onExamTimeChange,
  onStartExam,
}) => {
  return (
    <div className="h-12 w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
          
          <h1 className="text-5xl font-light tracking-tight">Mock Exam</h1>
        </div>

        <Tabs
          value={examMode}
          onValueChange={(value) => onExamModeChange(value as "past" | "custom")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="past">Past Papers</TabsTrigger>
            <TabsTrigger value="custom">Custom Mock Exam</TabsTrigger>
          </TabsList>
          <TabsContent value="past">
            <div className="grid gap-4">
              <div>
                <label className="text-xl font-semibold">Exam</label>
                <Select value={selectedExam} onValueChange={onExamChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select exam" />
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
              <div>
                <label className="text-xl font-semibold">Subject</label>
                <Select value={selectedSubject} onValueChange={onSubjectChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Year</label>
                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="custom">
            <div className="grid gap-4">
              <div>
                <label className="text-xl font-semibold">Exam</label>
                <Select value={selectedExam} onValueChange={onExamChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select exam" />
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
              <div>
                <label className="text-xl font-semibold">Subject</label>
                <Select value={selectedSubject} onValueChange={onSubjectChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Year</label>
                <Select value={selectedYear} onValueChange={onYearChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Level</label>
                <Select value={selectedLevel} onValueChange={onLevelChange}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-14 text-gray-500 text-lg">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xl font-semibold">Questions</label>
                <Input
                  type="number"
                  value={numberOfQuestions}
                  onChange={(e) => onNumberOfQuestionsChange(Number(e.target.value))}
                  className="w-32 bg-gray-50 border-gray-200 h-14 text-lg"
                  min={1}
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <Checkbox
                  id="skip"
                  checked={skipCompleted}
                  onCheckedChange={(checked) => onSkipCompletedChange(checked as boolean)}
                  className="w-5 h-5 border-2 border-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                />
                <label htmlFor="skip" className="text-lg font-medium">
                  Skip completed questions
                </label>
              </div>
              <div>
                <label className="text-xl font-semibold">Exam Time (minutes)</label>
                <Slider
                  value={[examTime]}
                  onValueChange={(value) => onExamTimeChange(value[0])}
                  max={120}
                  min={15}
                  step={5}
                  className="w-full"
                />
                <div className="text-center mt-2">{examTime} minutes</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-6 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Pencil className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-4xl font-light">Exam mode</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-light mb-4">Instructions</h3>
              <ul className="space-y-3 text-gray-600">
                <li>The mock exam will start as soon as you click the Start Exam button.</li>
                <li>Show all working whenever possible.</li>
                <li>Use fully labelled diagrams and references to the text/data where appropriate.</li>
                <li>Your score and feedback will be compiled into a report at the end of the exam.</li>
              </ul>
            </div>

            <RainbowButton
              onClick={onStartExam}
              disabled={
                !selectedExam ||
                !selectedSubject ||
                !selectedYear ||
                (examMode === "custom" && !selectedLevel)
              }
              className="w-auto"
            >
              Start Exam
              <span className="ml-1">{examMode === "past" ? "" : numberOfQuestions}</span>
            </RainbowButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamSetup
