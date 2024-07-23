import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, ...updatedFields } = req.body;

    try {
      // Find the UserPerformance record by userId
      const userPerformance = await prisma.userPerformance.findFirst({
        where: { userId },
      });

      if (!userPerformance) {
        return res.status(404).json({ message: 'User performance data not found' });
      }

      const userPerformanceId = userPerformance.id;

      const updateData: Prisma.UserPerformanceUpdateInput = {};

      // Aggregate the fields
      if (updatedFields.correctAnswers !== undefined) {
        updateData.correctAnswers = { increment: updatedFields.correctAnswers };
      }
      if (updatedFields.incorrectAnswers !== undefined) {
        updateData.incorrectAnswers = { increment: updatedFields.incorrectAnswers };
      }
      if (updatedFields.uniqueQuestions !== undefined) {
        updateData.uniqueQuestions = { increment: updatedFields.uniqueQuestions };
      }
      if (updatedFields.questionsAttempted !== undefined) {
        updateData.questionsAttempted = { increment: updatedFields.questionsAttempted };
      }
      if (updatedFields.timeSpent !== undefined) {
        updateData.timeSpent = { increment: updatedFields.timeSpent };
      }
      if (updatedFields.completed !== undefined) {
        updateData.completed = { increment: updatedFields.completed };
      }
      if (updatedFields.reviewed !== undefined) {
        updateData.reviewed = { increment: updatedFields.reviewed };
      }

      // Handle JSON fields (assuming they are arrays that need merging)
      if (updatedFields.weaknessBySubtopic !== undefined) {
        updateData.weaknessBySubtopic = {
          set: [
            ...(userPerformance.weaknessBySubtopic as Prisma.JsonArray),
            ...(updatedFields.weaknessBySubtopic as Prisma.JsonArray),
          ],
        };
      }
      if (updatedFields.improvementOverTime !== undefined) {
        updateData.improvementOverTime = {
          set: [
            ...(userPerformance.improvementOverTime as Prisma.JsonArray),
            ...(updatedFields.improvementOverTime as Prisma.JsonArray),
          ],
        };
      }
      if (updatedFields.topicPerformance !== undefined) {
        updateData.topicPerformance = {
          set: [
            ...(userPerformance.topicPerformance as Prisma.JsonArray),
            ...(updatedFields.topicPerformance as Prisma.JsonArray),
          ],
        };
      }

      // Update the record
      await prisma.userPerformance.update({
        where: { id: userPerformanceId },
        data: updateData,
      });

      res.status(200).json({ message: 'User performance updated successfully' });
    } catch (error) {
      console.error('Error updating user performance:', error);
      res.status(500).json({ message: 'Failed to update user performance' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
