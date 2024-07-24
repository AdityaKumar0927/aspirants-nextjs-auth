// global.d.ts
import { UserPerformance as PrismaUserPerformance } from '@prisma/client';

declare global {
  interface UserPerformance extends PrismaUserPerformance {}
}

interface MathJax {
  typesetPromise?: () => Promise<void>;
  typeset?: () => void;
}

interface Window {
  MathJax?: MathJax;
}

declare namespace JSX {
  interface IntrinsicElements {
    'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
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

  interface UserPerformance {
    correctAnswers: number;
    incorrectAnswers: number;
    uniqueQuestions: number;
    questionsAttempted: number;
    timeSpent: number;
    accuracy: number;
    weaknessBySubtopic: any;
    improvementOverTime: any;
    attemptRate: number;
    firstAttemptSuccessRate: number;
    reattemptAccuracy: number;
    topicPerformance: any;
    consistency: number;
    engagementLevel: number;
    completed: number;
    reviewed: number;
  }
  
}

export {};
