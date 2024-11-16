'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { Question, FiltersType } from './types'

interface QuestionContextType {
  questions: Question[]
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>
  filters: FiltersType
  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined)

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filters, setFilters] = useState<FiltersType>({
    exams: [],
    subjects: [],
    topics: [],
    subtopics: [],
    difficulties: [],
    types: [],
    years: [],
    status: 'all',
  })
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <QuestionContext.Provider value={{ questions, setQuestions, filters, setFilters, searchQuery, setSearchQuery }}>
      {children}
    </QuestionContext.Provider>
  )
}

export const useQuestionContext = () => {
  const context = useContext(QuestionContext)
  if (context === undefined) {
    throw new Error('useQuestionContext must be used within a QuestionProvider')
  }
  return context
}