// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, QuestionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

// Utility function to convert empty strings to null values
const convertEmptyStringsToNull = (data: any) => {
  const cleanObject = (obj: any) => {
    Object.keys(obj).forEach((key) => {
      if (obj[key] === '') {
        obj[key] = null; // Convert empty strings to null
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleanObject(obj[key]); // Recursively clean nested objects
      }
    });
  };

  if (Array.isArray(data)) {
    data.forEach((item) => cleanObject(item));
  } else {
    cleanObject(data);
  }

  return data;
};

export async function POST(request: Request) {
  // Check user session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse the incoming data
    let questions = await request.json();

    // Convert empty strings to null
    questions = convertEmptyStringsToNull(questions);

    // Format and validate incoming data with a default status assignment
    const formattedQuestions = questions.map((question: any) => ({
      exam: question.exam || null,
      questionId: question.questionId || null,
      text: question.text || null,
      subject: question.subject || null,
      topic: question.topic || null,
      subtopic: question.subtopic || null,
      difficulty: question.difficulty || null,
      type: question.type || null,
      year: question.year ? parseInt(question.year, 10) : null,
      reviewed: question.reviewed ?? false,
      completed: question.completed ?? false,
      options: Array.isArray(question.options) ? question.options : [],
      correctOption: question.correctOption || null,
      markscheme: question.markscheme || null,
      marks: question.marks ? parseInt(question.marks, 10) : null,
      correctAttempts: question.correctAttempts || null,
      wrongAttempts: question.wrongAttempts || null,
      averageTimeTaken: question.averageTimeTaken || null,
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || null,
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
