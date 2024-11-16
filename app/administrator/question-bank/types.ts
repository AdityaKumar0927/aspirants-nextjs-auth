export type QuestionStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED'

export interface Question {
  questionId: string
  exam: string
  text: string
  subject: string
  topic: string
  subtopic: string | null
  difficulty: string
  type: string
  year: number
  reviewed: boolean
  completed: boolean
  options: string[]
  correctOption: string | null
  markscheme: string | null
  notes: { id: string; content: string }[]
  lastAttempted: string | null
  diagramUrl: string | null
  status: QuestionStatus
}

export type FiltersType = {
  exams: string[]
  subjects: string[]
  topics: string[]
  subtopics: string[]
  difficulties: string[]
  types: string[]
  years: string[]
  status: string
}