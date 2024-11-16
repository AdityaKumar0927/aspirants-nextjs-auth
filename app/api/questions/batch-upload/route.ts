import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { Prisma, QuestionStatus } from '@prisma/client';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 10; // Smaller batch size for better handling

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
};

type ProcessedQuestion = Prisma.QuestionCreateManyInput;

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
    status: 'ACTIVE' as QuestionStatus
  };

  if (!processedQuestion.text) {
    throw new Error('Question text is required');
  }

  if (isNaN(processedQuestion.year) || processedQuestion.year < 1900 || processedQuestion.year > currentYear) {
    processedQuestion.year = currentYear;
  }

  return processedQuestion;
}

async function* processQuestionsInBatches(questions: QuestionInput[]) {
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const processedBatch = batch.map(validateAndFormatQuestion);

    try {
      await prisma.question.createMany({
        data: processedBatch,
        skipDuplicates: true,
      });
      yield {
        success: true,
        processed: i + batch.length,
        total: questions.length,
        batch: processedBatch.length
      };
    } catch (error) {
      yield {
        success: false,
        processed: i,
        total: questions.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        batch: processedBatch.length
      };
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  try {
    const body = await req.json();
    let questionsInput: QuestionInput[];

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
      await writer.write(encoder.encode(JSON.stringify({
        success: false,
        error: 'Invalid data format',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      })));
      await writer.close();
      return new Response(stream.readable, {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (questionsInput.length === 0) {
      await writer.write(encoder.encode(JSON.stringify({
        success: false,
        error: 'No questions provided'
      })));
      await writer.close();
      return new Response(stream.readable, {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const processGenerator = processQuestionsInBatches(questionsInput);
    
    for await (const result of processGenerator) {
      await writer.write(encoder.encode(JSON.stringify(result) + '\n'));
    }

    await writer.write(encoder.encode(JSON.stringify({
      success: true,
      message: 'Upload completed',
      total: questionsInput.length
    })));
    
    await writer.close();
    return new Response(stream.readable, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    await writer.write(encoder.encode(JSON.stringify({
      success: false,
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })));
    await writer.close();
    return new Response(stream.readable, {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}