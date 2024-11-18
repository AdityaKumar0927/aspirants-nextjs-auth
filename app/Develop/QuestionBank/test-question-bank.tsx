import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface QuestionType {
  questionId: string
  text: string
  subject: string
  difficulty: string
  year: string
  type: 'Multiple Choice' | 'Numerical' | 'Short Answer'
  options?: string[]
  correctOption?: string
  correctAnswer?: string
  exam: string
  markScheme: string
  tags: string[]
}

interface QuestionProps {
  question: QuestionType
  feedback: string
  selectedOption: string
  onOptionSelect: (option: string) => void
  onNumericalAnswerChange: (answer: string) => void
  onSubmit: () => void
  onShowMarkscheme: () => void
  showMarkscheme: boolean
}

const Question: React.FC<QuestionProps> = ({
  question,
  feedback,
  selectedOption,
  onOptionSelect,
  onNumericalAnswerChange,
  onSubmit,
  onShowMarkscheme,
  showMarkscheme
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        {question.type === 'Multiple Choice' && (
          <RadioGroup value={selectedOption} onValueChange={onOptionSelect}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        {question.type === 'Numerical' && (
          <Input
            type="number"
            placeholder="Enter your answer"
            onChange={(e) => onNumericalAnswerChange(e.target.value)}
          />
        )}
        {question.type === 'Short Answer' && (
          <Input
            type="text"
            placeholder="Enter your answer"
            onChange={(e) => onNumericalAnswerChange(e.target.value)}
          />
        )}
        {feedback && <p className="mt-4 text-sm text-gray-600">{feedback}</p>}
        {showMarkscheme && (
          <div className="mt-4">
            <h4 className="font-semibold">Mark Scheme:</h4>
            <p>{question.markScheme}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={onSubmit}>Submit</Button>
        <Button variant="outline" onClick={onShowMarkscheme}>
          {showMarkscheme ? 'Hide Mark Scheme' : 'Show Mark Scheme'}
        </Button>
      </CardFooter>
    </Card>
  )
}

interface TestQuestionBankProps {
  questions: QuestionType[]
}

const TestQuestionBank: React.FC<TestQuestionBankProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [numericalAnswer, setNumericalAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [showMarkscheme, setShowMarkscheme] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
  }

  const handleNumericalAnswerChange = (answer: string) => {
    setNumericalAnswer(answer)
  }

  const handleSubmit = () => {
    let isCorrect = false
    if (currentQuestion.type === 'Multiple Choice') {
      isCorrect = selectedOption === currentQuestion.correctOption
    } else if (currentQuestion.type === 'Numerical' || currentQuestion.type === 'Short Answer') {
      isCorrect = numericalAnswer === currentQuestion.correctAnswer
    }

    setFeedback(isCorrect ? 'Correct!' : 'Incorrect. Try again.')
  }

  const handleShowMarkscheme = () => {
    setShowMarkscheme(!showMarkscheme)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption('')
      setNumericalAnswer('')
      setFeedback('')
      setShowMarkscheme(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Test Your Knowledge</h2>
      {currentQuestion && (
        <Question
          key={currentQuestion.questionId}
          question={currentQuestion}
          feedback={feedback}
          selectedOption={selectedOption}
          onOptionSelect={handleOptionSelect}
          onNumericalAnswerChange={handleNumericalAnswerChange}
          onSubmit={handleSubmit}
          onShowMarkscheme={handleShowMarkscheme}
          showMarkscheme={showMarkscheme}
        />
      )}
      {currentQuestionIndex < questions.length - 1 && (
        <Button onClick={handleNextQuestion} className="mt-4">
          Next Question
        </Button>
      )}
    </div>
  )
}

export default TestQuestionBank