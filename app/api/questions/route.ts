// app/api/questions/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      select: {
        questionId: true,
        exam: true,
        text: true,
        subject: true,
        topic: true,
        subtopic: true,
        difficulty: true,
        type: true,
        year: true,
        reviewed: true,
        completed: true,
        options: true,
        correctOption: true,
        markscheme: true,
        notes: true,
        lastAttempted: true,
        diagramUrl: true,
      },
    });
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  try {
    const newQuestion = await prisma.question.create({
      data,
    });
    return NextResponse.json(newQuestion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { questionId, ...updates } = await request.json();

  try {
    const updatedQuestion = await prisma.question.update({
      where: { questionId },
      data: updates,
    });
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { questionId } = await request.json();

  try {
    await prisma.question.delete({
      where: { questionId },
    });
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
