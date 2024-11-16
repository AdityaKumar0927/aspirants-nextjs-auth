import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

  if (processedQuestion.type === 'Multiple Choice' && processedQuestion.options.length < 2) {
    throw new Error('Multiple choice questions must have at least two options');
  }

  if (typeof processedQuestion.correctOption === 'string' && processedQuestion.correctOption.length === 1) {
    const index = processedQuestion.correctOption.toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < processedQuestion.options.length) {
      processedQuestion.correctOption = processedQuestion.options[index];
    } else {
      throw new Error('Invalid correct option');
    }
  }

  return processedQuestion;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.error('Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    let questionsInput: QuestionInput[];

    if (Array.isArray(body)) {
      questionsInput = body;
    } else if (body.questions && Array.isArray(body.questions)) {
      questionsInput = body.questions;
    } else if (typeof body.text === 'string') {
      try {
        questionsInput = JSON.parse(body.text);
        if (!Array.isArray(questionsInput)) {
          throw new Error('Parsed text is not an array');
        }
      } catch (parseError) {
        console.error('Error parsing questions from text:', parseError);
        return NextResponse.json({ message: 'Invalid questions data format in text field', error: parseError instanceof Error ? parseError.message : 'Unknown parsing error' }, { status: 400 });
      }
    } else {
      console.error('Invalid questions data format:', body);
      return NextResponse.json({ message: 'Invalid questions data format', receivedData: body }, { status: 400 });
    }

    if (questionsInput.length === 0) {
      console.error('No questions provided');
      return NextResponse.json({ message: 'No questions provided' }, { status: 400 });
    }

    const uploadResult = {
      success: [] as ProcessedQuestion[],
      failures: [] as { question: QuestionInput; error: string }[]
    };

    for (const questionInput of questionsInput) {
      try {
        const processedQuestion = validateAndFormatQuestion(questionInput);
        uploadResult.success.push(processedQuestion);
      } catch (error) {
        console.error('Error processing question:', error);
        uploadResult.failures.push({ 
          question: questionInput, 
          error: error instanceof Error ? error.message : 'Failed to process question'
        });
      }
    }

    console.log(`Processed ${uploadResult.success.length} questions successfully, ${uploadResult.failures.length} failures`);

    if (uploadResult.success.length > 0) {
      try {
        await prisma.question.createMany({
          data: uploadResult.success,
          skipDuplicates: true,
        });
        console.log(`Successfully inserted ${uploadResult.success.length} questions`);
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ 
          message: 'Error inserting questions into database', 
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          successfullyProcessed: uploadResult.success.length,
          failedToProcess: uploadResult.failures.length
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Batch upload completed',
      totalProcessed: questionsInput.length,
      successCount: uploadResult.success.length,
      failureCount: uploadResult.failures.length,
      failures: uploadResult.failures
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