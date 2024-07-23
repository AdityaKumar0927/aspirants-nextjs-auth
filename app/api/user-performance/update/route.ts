import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      questionId,
      correctAnswers,
      incorrectAnswers,
      uniqueQuestions,
      questionsAttempted,
      timeSpent,
      accuracy,
      weaknessBySubtopic,
      timePerQuestion,
      improvementOverTime,
      attemptRate,
      firstAttemptSuccessRate,
      reattemptAccuracy,
      topicPerformance,
      consistency,
      engagementLevel,
      completed,
      reviewed,
    } = await request.json();

    if (!questionId) {
      console.error('Question ID is missing in the request body');
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const userPerformance = await prisma.userPerformance.upsert({
      where: { userId: session.user.id },
      update: {
        correctAnswers,
        incorrectAnswers,
        uniqueQuestions,
        questionsAttempted,
        timeSpent,
        accuracy,
        weaknessBySubtopic,
        timePerQuestion,
        improvementOverTime,
        attemptRate,
        firstAttemptSuccessRate,
        reattemptAccuracy,
        topicPerformance,
        consistency,
        engagementLevel,
        completed,
        reviewed,
      },
      create: {
        userId: session.user.id,
        correctAnswers,
        incorrectAnswers,
        uniqueQuestions,
        questionsAttempted,
        timeSpent,
        accuracy,
        weaknessBySubtopic,
        timePerQuestion,
        improvementOverTime,
        attemptRate,
        firstAttemptSuccessRate,
        reattemptAccuracy,
        topicPerformance,
        consistency,
        engagementLevel,
        completed,
        reviewed,
      },
    });

    return NextResponse.json(userPerformance);
  } catch (error) {
    console.error('Error updating user performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
