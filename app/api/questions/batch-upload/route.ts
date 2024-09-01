// app/api/questions/batch-upload/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, QuestionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const questions = await request.json();

    // Validate and format data to match the Prisma schema
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
      reviewed: question.reviewed,
      completed: question.completed,
      options: question.options || [],
      correctOption: question.correctOption,
      markscheme: question.markscheme,
      marks: question.marks ? parseInt(question.marks, 10) : null, // Convert to integer or null
      correctAttempts: question.correctAttempts ? parseInt(question.correctAttempts, 10) : null,
      wrongAttempts: question.wrongAttempts ? parseInt(question.wrongAttempts, 10) : null,
      averageTimeTaken: question.averageTimeTaken ? parseFloat(question.averageTimeTaken) : null,
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || null,
      status: QuestionStatus.ACTIVE, // Set a default status or validate if included in input
    }));

    // Perform batch creation using createMany
    const createdQuestions = await prisma.question.createMany({
      data: formattedQuestions,
      skipDuplicates: true,
    });

    return NextResponse.json(createdQuestions, { status: 201 });
  } catch (error) {
    console.error('Error uploading batch of questions:', error);
    return NextResponse.json({ error: 'Failed to upload batch of questions' }, { status: 500 });
  }
}
