import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// New configuration method for Next.js 13 App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BATCH_SIZE = 25; // Process questions in smaller batches

type QuestionInput = {
  exam: string;
  questionId?: string;
  text: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  type: string;
  year: number | string;
  options: string[];
  correctOption: string;
  markscheme?: string;
  marks?: string;
  reviewed?: boolean;
  completed?: boolean;
  correctAttempts?: string | number;
  wrongAttempts?: string | number;
  averageTimeTaken?: string | number;
  lastAttempted?: string | null;
  diagramUrl?: string;
  [key: string]: any;
};

type ProcessedQuestion = Omit<Prisma.QuestionCreateManyInput, 'id' | 'options'> & {
  questionId: string;
  options: string[];
};

function validateAndFormatQuestion(question: QuestionInput): ProcessedQuestion {
  const currentYear = new Date().getFullYear();
  
  const processedQuestion: ProcessedQuestion = {
    exam: question.exam || 'Unknown',
    questionId: question.questionId || `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: question.text,
    subject: question.subject || 'General',
    topic: question.topic || 'Miscellaneous',
    subtopic: question.subtopic || '',
    difficulty: ['Easy', 'Medium', 'Hard'].includes(question.difficulty) ? question.difficulty : 'Medium',
    type: question.type || 'Multiple Choice',
    year: typeof question.year === 'string' ? parseInt(question.year, 10) : question.year,
    options: Array.isArray(question.options) ? question.options : [],
    correctOption: question.correctOption,
    markscheme: question.markscheme || '',
    marks: question.marks ? question.marks.toString() : '0',
    reviewed: question.reviewed || false,
    completed: question.completed || false,
    correctAttempts: question.correctAttempts ? question.correctAttempts.toString() : '0',
    wrongAttempts: question.wrongAttempts ? question.wrongAttempts.toString() : '0',
    averageTimeTaken: question.averageTimeTaken ? question.averageTimeTaken.toString() : '0',
    lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
    diagramUrl: question.diagramUrl || '',
    status: 'ACTIVE'
  };

  if (!processedQuestion.text) {
    throw new Error('Question text is required');
  }

  if (isNaN(processedQuestion.year) || processedQuestion.year < 1900 || processedQuestion.year > currentYear) {
    processedQuestion.year = currentYear;
  }

  return processedQuestion;
}

async function processBatch(questions: QuestionInput[]) {
  const processedQuestions: ProcessedQuestion[] = [];
  const failures: { question: QuestionInput; error: string }[] = [];

  for (const question of questions) {
    try {
      const processedQuestion = validateAndFormatQuestion(question);
      processedQuestions.push(processedQuestion);
    } catch (error) {
      failures.push({
        question,
        error: error instanceof Error ? error.message : 'Failed to process question'
      });
    }
  }

  if (processedQuestions.length > 0) {
    await prisma.question.createMany({
      data: processedQuestions,
      skipDuplicates: true,
    });
  }

  return { successes: processedQuestions, failures };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let questionsInput: QuestionInput[];

    // Parse the input data
    try {
      if (Array.isArray(body)) {
        questionsInput = body;
      } else if (body.questions && Array.isArray(body.questions)) {
        questionsInput = body.questions;
      } else if (typeof body.text === 'string') {
        questionsInput = JSON.parse(body.text);
        if (!Array.isArray(questionsInput)) {
          throw new Error('Parsed text is not an array');
        }
      } else {
        throw new Error('Invalid questions data format');
      }
    } catch (parseError) {
      console.error('Error parsing questions:', parseError);
      return NextResponse.json({ 
        message: 'Invalid questions data format', 
        error: parseError instanceof Error ? parseError.message : 'Unknown parsing error' 
      }, { status: 400 });
    }

    if (questionsInput.length === 0) {
      return NextResponse.json({ message: 'No questions provided' }, { status: 400 });
    }

    // Process questions in batches
    const results = {
      totalProcessed: questionsInput.length,
      successCount: 0,
      failureCount: 0,
      failures: [] as { question: QuestionInput; error: string }[]
    };

    // Split questions into batches
    for (let i = 0; i < questionsInput.length; i += BATCH_SIZE) {
      const batch = questionsInput.slice(i, i + BATCH_SIZE);
      const batchResult = await processBatch(batch);
      
      results.successCount += batchResult.successes.length;
      results.failures.push(...batchResult.failures);
      results.failureCount += batchResult.failures.length;

      // Add a small delay between batches to prevent overwhelming the database
      if (i + BATCH_SIZE < questionsInput.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      message: 'Batch upload completed',
      ...results
    });

  } catch (error) {
    console.error('Error during batch upload:', error);
    return NextResponse.json(
      { 
        message: 'An error occurred during batch upload', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}