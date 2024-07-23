import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, questionId, ...updatedFields } = await req.json();

    const userPerformance = await prisma.userPerformance.findUnique({
      where: { userId },
    });

    if (!userPerformance) {
      return NextResponse.json({ message: 'User performance data not found' }, { status: 404 });
    }

    const updateData: Prisma.UserPerformanceUpdateInput = { ...updatedFields };

    // Aggregate the fields
    if (updatedFields.correctAnswers !== undefined) {
      updateData.correctAnswers = userPerformance.correctAnswers + updatedFields.correctAnswers;
    }
    if (updatedFields.incorrectAnswers !== undefined) {
      updateData.incorrectAnswers = userPerformance.incorrectAnswers + updatedFields.incorrectAnswers;
    }
    if (updatedFields.uniqueQuestions !== undefined) {
      updateData.uniqueQuestions = userPerformance.uniqueQuestions + updatedFields.uniqueQuestions;
    }
    if (updatedFields.questionsAttempted !== undefined) {
      updateData.questionsAttempted = userPerformance.questionsAttempted + updatedFields.questionsAttempted;
    }
    if (updatedFields.timeSpent !== undefined) {
      updateData.timeSpent = userPerformance.timeSpent + updatedFields.timeSpent;
    }
    if (updatedFields.completed !== undefined) {
      updateData.completed = userPerformance.completed + updatedFields.completed;
    }
    if (updatedFields.reviewed !== undefined) {
      updateData.reviewed = userPerformance.reviewed + updatedFields.reviewed;
    }

    // Handle JSON fields (assuming they are arrays that need merging)
    if (updatedFields.weaknessBySubtopic !== undefined) {
      updateData.weaknessBySubtopic = [
        ...(userPerformance.weaknessBySubtopic as Prisma.JsonArray),
        ...(updatedFields.weaknessBySubtopic as Prisma.JsonArray),
      ];
    }
    if (updatedFields.improvementOverTime !== undefined) {
      updateData.improvementOverTime = [
        ...(userPerformance.improvementOverTime as Prisma.JsonArray),
        ...(updatedFields.improvementOverTime as Prisma.JsonArray),
      ];
    }
    if (updatedFields.topicPerformance !== undefined) {
      updateData.topicPerformance = [
        ...(userPerformance.topicPerformance as Prisma.JsonArray),
        ...(updatedFields.topicPerformance as Prisma.JsonArray),
      ];
    }

    // Update the record
    await prisma.userPerformance.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ message: 'User performance updated successfully' });
  } catch (error) {
    console.error('Error updating user performance:', error);
    return NextResponse.json({ message: 'Failed to update user performance' }, { status: 500 });
  }
}
