// hooks/useQuestionFilter.ts
import { useState, useEffect, useCallback } from 'react';

// types.ts
export interface QuestionType {
    exam: string;
    questionId: string;
    text: string;
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: string;
    type: "Multiple Choice" | "Numerical";
    year: string;
    reviewed: boolean;
    completed: boolean;
    options?: string[];
    correctOption?: string;
    markscheme?: string;
    notes?: string;
  }
  
  export type FiltersType = {
    exams: string[];
    subjects: string[];
    topics: string[];
    subtopics: string[];
    difficulties: string[];
    types: string[];
    years: string[];
    status: string;
  };
  
  export const isStringArray = (value: any): value is string[] => {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
  };
  

const initialFilters: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  types: [],
  years: [],
  status: "all",
};

export const useQuestionFilter = (questions: QuestionType[]) => {
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>(questions);

  const exams = Array.from(new Set(questions.map((q) => q.exam)));
  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const topics = Array.from(new Set(questions.map((q) => q.topic)));
  const subtopics = Array.from(new Set(questions.map((q) => q.subtopic)));
  const difficulties = Array.from(new Set(questions.map((q) => q.difficulty)));
  const years = Array.from(new Set(questions.map((q) => q.year)));
  const types = Array.from(new Set(questions.map((q) => q.type)));

  const filterQuestions = useCallback(() => {
    let filtered = questions.filter((question) => {
      return (
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year)) &&
        (!filters.types.length || filters.types.includes(question.type))
      );
    });

    if (filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed);
    } else if (filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed);
    }

    setFilteredQuestions(filtered);
  }, [questions, filters]);

  useEffect(() => {
    filterQuestions();
  }, [filterQuestions]);

  const handleFilterChange = (tag: keyof FiltersType, value: string) => {
    setFilters((prevFilters) => {
      const filterValues = prevFilters[tag];
      if (isStringArray(filterValues)) {
        const isSelected = filterValues.includes(value);
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value];
        return { ...prevFilters, [tag]: updatedFilter };
      }
      return prevFilters;
    });
  };

  return {
    filters,
    filteredQuestions,
    exams,
    subjects,
    topics,
    subtopics,
    difficulties,
    years,
    types,
    handleFilterChange,
  };
};
