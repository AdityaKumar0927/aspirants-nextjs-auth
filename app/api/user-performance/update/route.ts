import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      correctAnswers,
      incorrectAnswers,
      uniqueQuestions,
      questionsAttempted,
      timeSpent,
      accuracy,
      weaknessBySubtopic,
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
