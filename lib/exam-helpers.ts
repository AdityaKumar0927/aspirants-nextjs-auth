export interface QuestionType {
  id: string
  text: string
  options: { [key: string]: string }
  correctOption: string
  exam: string
  subject: string
  year: string
  topic: string
  subtopic: string
  diagramUrl?: string
  type: "Multiple Choice" | "Numerical"
  markscheme?: string
  explanation: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export interface TopicPerformance {
  correct: number
  total: number
}

export interface ExamResultsType {
  totalQuestions: number
  correctAnswersCount: number
  incorrectAnswers: number
  score: number
  topicPerformance: Record<string, TopicPerformance>
  subtopicPerformance: Record<string, TopicPerformance>
  topStrengths: [string, TopicPerformance][]
  topWeaknesses: [string, TopicPerformance][]
  userAnswers: string[]
  correctAnswers: string[]
  timeSpentPerQuestion: number[]
  averageTimePerQuestion: number
  topicWiseIncorrectAnswers: Record<string, number>
  questions: QuestionType[]
  skillLevels: Record<string, number>
}

