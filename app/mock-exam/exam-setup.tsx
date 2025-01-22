"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BookOpen, Clock, FileQuestion, GraduationCap, Zap } from "lucide-react"

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
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary rounded-full">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Mock Exam Setup</CardTitle>
              <CardDescription>Configure your exam settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={examMode}
            onValueChange={(value) => onExamModeChange(value as "past" | "custom")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="past" className="text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Past Papers
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-lg">
                <FileQuestion className="w-5 h-5 mr-2" />
                Custom Mock Exam
              </TabsTrigger>
            </TabsList>
            <TabsContent value="past">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="exam" className="text-lg font-medium">
                    Exam
                  </Label>
                  <Select value={selectedExam} onValueChange={onExamChange}>
                    <SelectTrigger id="exam" className="w-full">
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
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-lg font-medium">
                    Subject
                  </Label>
                  <Select value={selectedSubject} onValueChange={onSubjectChange}>
                    <SelectTrigger id="subject" className="w-full">
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
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-lg font-medium">
                    Year
                  </Label>
                  <Select value={selectedYear} onValueChange={onYearChange}>
                    <SelectTrigger id="year" className="w-full">
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
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="custom-exam" className="text-lg font-medium">
                    Exam
                  </Label>
                  <Select value={selectedExam} onValueChange={onExamChange}>
                    <SelectTrigger id="custom-exam" className="w-full">
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
                <div className="space-y-2">
                  <Label htmlFor="custom-subject" className="text-lg font-medium">
                    Subject
                  </Label>
                  <Select value={selectedSubject} onValueChange={onSubjectChange}>
                    <SelectTrigger id="custom-subject" className="w-full">
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
                <div className="space-y-2">
                  <Label htmlFor="custom-year" className="text-lg font-medium">
                    Year
                  </Label>
                  <Select value={selectedYear} onValueChange={onYearChange}>
                    <SelectTrigger id="custom-year" className="w-full">
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
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-lg font-medium">
                    Level
                  </Label>
                  <Select value={selectedLevel} onValueChange={onLevelChange}>
                    <SelectTrigger id="level" className="w-full">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questions" className="text-lg font-medium">
                    Number of Questions
                  </Label>
                  <Input
                    id="questions"
                    type="number"
                    value={numberOfQuestions}
                    onChange={(e) => onNumberOfQuestionsChange(Number(e.target.value))}
                    className="w-full"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-time" className="text-lg font-medium">
                    Exam Time (minutes)
                  </Label>
                  <Slider
                    id="exam-time"
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
              <div className="flex items-center space-x-3 mt-6">
                <Checkbox
                  id="skip"
                  checked={skipCompleted}
                  onCheckedChange={(checked) => onSkipCompletedChange(checked as boolean)}
                />
                <Label htmlFor="skip" className="text-base font-medium">
                  Skip completed questions
                </Label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-secondary rounded-full">
                <GraduationCap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Exam Instructions</h2>
            </div>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>The mock exam will start as soon as you click the Start Exam button.</li>
              <li>Show all working whenever possible.</li>
              <li>Use fully labelled diagrams and references to the text/data where appropriate.</li>
              <li>Your score and feedback will be compiled into a report at the end of the exam.</li>
            </ul>
          </div>

          <Button
            onClick={onStartExam}
            disabled={!selectedExam || !selectedSubject || !selectedYear || (examMode === "custom" && !selectedLevel)}
            className="w-full mt-8 text-lg h-12"
          >
            <Clock className="w-5 h-5 mr-2" />
            Start Exam
            {examMode === "custom" && <span className="ml-2">({numberOfQuestions} questions)</span>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExamSetup

