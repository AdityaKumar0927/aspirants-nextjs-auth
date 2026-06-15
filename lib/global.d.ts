// global.d.ts
import { UserPerformance as PrismaUserPerformance } from '@prisma/client';

declare global {
  interface UserPerformance extends PrismaUserPerformance {}
}

// katex chemistry extension ships JS without type declarations.
declare module "katex/contrib/mhchem";

interface MathJax {
  typesetPromise?: () => Promise<void>;
  typeset?: () => void;
}

interface Window {
  MathJax?: MathJax;
}

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


declare global {
  interface QuestionType {
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
    lastAttempted?: string;
    marks?: string;
    correctAttempts?: string;
    wrongAttempts?: string;
    averageTimeTaken?: string;
  }

  type UserPerformance = {
    questionId: string;
    correctAnswers: number;
    incorrectAnswers: number;
    uniqueQuestions: number;
    questionsAttempted: number;
    timeSpent: number;
    accuracy: number;
    weaknessBySubtopic: { subtopic: string; weakness: number }[];
    improvementOverTime: { date: string; improvement: number }[];
    attemptRate: number;
    firstAttemptSuccessRate: number;
    reattemptAccuracy: number;
    topicPerformance: { topic: string; performance: number }[];
    consistency: number;
    engagementLevel: number;
    completed: boolean;
    reviewed: boolean;
    lastAttempted: string;
    dailyAccuracy: { date: string; accuracy: number }[];
    dailyTimePerQuestion: { date: string; time: number }[];
    dailyStudyTime: { date: string; time: number }[];
    currentYearAccuracy: number;
    previousYearAccuracy: number;
    timePerQuestion: number;
    timePerSubtopic: number;
    dailyTimePerSubtopic: { date: string; time: number }[]; // Add this line if it's missing
    studyTime: number;
  };
  
  
}


export {};
