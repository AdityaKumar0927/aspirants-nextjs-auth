// app/api/user-performance/route.ts
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
        correctAnswers: correctAnswers || 0,
        incorrectAnswers: incorrectAnswers || 0,
        uniqueQuestions: uniqueQuestions || 0,
        questionsAttempted: questionsAttempted || 0,
        timeSpent: timeSpent || 0,
        accuracy: accuracy || 0,
        weaknessBySubtopic: weaknessBySubtopic || {},
        improvementOverTime: improvementOverTime || {},
        attemptRate: attemptRate || 0,
        firstAttemptSuccessRate: firstAttemptSuccessRate || 0,
        reattemptAccuracy: reattemptAccuracy || 0,
        topicPerformance: topicPerformance || {},
        consistency: consistency || 0,
        engagementLevel: engagementLevel || 0,
        completed: completed || 0,
        reviewed: reviewed || 0,
      },
    });

    return NextResponse.json(userPerformance);
  } catch (error) {
    console.error('Error updating user performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
