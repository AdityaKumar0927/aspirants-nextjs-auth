// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Parse the incoming request body as JSON
    const questions = await request.json();

    // Ensure that questions is an array and each item has the necessary fields
    if (!Array.isArray(questions) || questions.some(q => !q.text || !q.questionId)) {
      return NextResponse.json({ error: 'Invalid question format' }, { status: 400 });
    }

    // Create questions in the database
    const createdQuestions = await prisma.question.createMany({
      data: questions,
      skipDuplicates: true, // Optional: Skip duplicates if necessary
    });

    return NextResponse.json(createdQuestions, { status: 201 });
  } catch (error) {
    console.error('Error uploading batch of questions:', error);
    return NextResponse.json({ error: 'Failed to upload batch of questions' }, { status: 500 });
  }
}
