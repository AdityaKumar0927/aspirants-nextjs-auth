// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, QuestionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Check user session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse the incoming data
    const questions = await request.json();

    // Format and validate incoming data with a default status assignment
    const formattedQuestions = questions.map((question: any) => ({
      exam: question.exam,
      questionId: question.questionId,
      text: question.text,
      subject: question.subject,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      type: question.type,
      year: parseInt(question.year, 10), // Convert year to integer
      reviewed: question.reviewed ?? false,
      completed: question.completed ?? false,
      options: Array.isArray(question.options) ? question.options : [], // Ensure options is an array
      correctOption: question.correctOption,
      markscheme: question.markscheme,
      marks: question.marks ? parseInt(question.marks, 10) : null, // Convert marks to integer or null
      correctAttempts: question.correctAttempts || null,
      wrongAttempts: question.wrongAttempts || null,
      averageTimeTaken: question.averageTimeTaken || null,
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || null,
      // Assign ACTIVE status if missing or invalid
      status: Object.values(QuestionStatus).includes(question.status)
        ? question.status
        : QuestionStatus.ACTIVE,
    }));

    // Perform batch creation of questions
    const createdQuestions = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true, // Prevents duplication errors
    });

    return NextResponse.json({ message: 'Questions uploaded successfully', createdQuestions });
  } catch (error) {
    console.error('Error uploading batch of questions:', error);
    return NextResponse.json({ error: 'Failed to upload batch of questions' }, { status: 500 });
  }
}
