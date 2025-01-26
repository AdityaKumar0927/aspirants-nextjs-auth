/**
 * exam-helpers.ts
 */

export interface QuestionType {
  // Use string if your question 'id' is indeed a string (like a UUID or something from Firestore).
  // If your DB's ID is an integer, change this to 'number' and adjust your code accordingly.
  id: string

  text: string

  /**
   * The options are a dictionary/object:
   * {
   *   "A": "Option A text",
   *   "B": "Option B text",
   *   ...
   * }
   */
  options: { [key: string]: string }

  correctOption: string

  exam: string          // e.g. "jee-main", "jee-advanced"
  subject: string       // e.g. "Mathematics", "Physics", "Chemistry"
  year: string          // e.g. "2023"
  topic: string         // e.g. "Calculus"
  subtopic: string      // e.g. "Definite Integrals"

  diagramUrl?: string   // URL to any diagram or image for the question
  type: "Multiple Choice" | "Numerical"

  markscheme?: string   // Possibly the official solution snippet
  explanation: string   // Additional explanation or solution steps

  // 'Easy' | 'Medium' | 'Hard'
  difficulty: "Easy" | "Medium" | "Hard"
}

/**
 * For tracking performance in a topic or subtopic:
 */
export interface TopicPerformance {
  correct: number
  total: number
}

/**
 * Aggregated exam results after submission:
 */
export interface ExamResultsType {
  totalQuestions: number
  correctAnswersCount: number
  incorrectAnswers: number
  score: number

  topicPerformance: Record<string, TopicPerformance>
  subtopicPerformance: Record<string, TopicPerformance>
  topStrengths: [string, TopicPerformance][]
  topWeaknesses: [string, TopicPerformance][]

  userAnswers: string[]      // user's picked answers
  correctAnswers: string[]   // actual correct answers

  timeSpentPerQuestion: number[]
  averageTimePerQuestion: number

  topicWiseIncorrectAnswers: Record<string, number>

  questions: QuestionType[]  // the actual question objects from the exam

  // For radar/spider chart or other skill breakdown
  skillLevels: Record<string, number>
}
