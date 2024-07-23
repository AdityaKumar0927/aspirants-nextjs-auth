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

    const data = await request.json();

    const userPerformance = await prisma.userPerformance.upsert({
      where: { userId: session.user.id },
      update: {
        correctAnswers: data.correctAnswers ?? undefined,
        incorrectAnswers: data.incorrectAnswers ?? undefined,
        uniqueQuestions: data.uniqueQuestions ?? undefined,
        questionsAttempted: data.questionsAttempted ?? undefined,
        timeSpent: data.timeSpent ?? undefined,
        accuracy: data.accuracy ?? undefined,
        weaknessBySubtopic: data.weaknessBySubtopic ?? undefined,
        timePerQuestion: data.timePerQuestion ?? undefined,
        improvementOverTime: data.improvementOverTime ?? undefined,
        attemptRate: data.attemptRate ?? undefined,
        firstAttemptSuccessRate: data.firstAttemptSuccessRate ?? undefined,
        reattemptAccuracy: data.reattemptAccuracy ?? undefined,
        topicPerformance: data.topicPerformance ?? undefined,
        consistency: data.consistency ?? undefined,
        engagementLevel: data.engagementLevel ?? undefined,
        completed: data.completed ?? undefined,
        reviewed: data.reviewed ?? undefined,
      },
      create: {
        userId: session.user.id,
        correctAnswers: data.correctAnswers ?? 0,
        incorrectAnswers: data.incorrectAnswers ?? 0,
        uniqueQuestions: data.uniqueQuestions ?? 0,
        questionsAttempted: data.questionsAttempted ?? 0,
        timeSpent: data.timeSpent ?? 0,
        accuracy: data.accuracy ?? 0,
        weaknessBySubtopic: data.weaknessBySubtopic ?? {},
        timePerQuestion: data.timePerQuestion ?? 0,
        improvementOverTime: data.improvementOverTime ?? {},
        attemptRate: data.attemptRate ?? 0,
        firstAttemptSuccessRate: data.firstAttemptSuccessRate ?? 0,
        reattemptAccuracy: data.reattemptAccuracy ?? 0,
        topicPerformance: data.topicPerformance ?? {},
        consistency: data.consistency ?? 0,
        engagementLevel: data.engagementLevel ?? 0,
        completed: data.completed ?? false,
        reviewed: data.reviewed ?? false,
      },
    });

    return NextResponse.json(userPerformance);
  } catch (error) {
    console.error('Error updating user performance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
