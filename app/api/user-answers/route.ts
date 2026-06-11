import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { gradeAnswer } from "@/lib/grade";

const postSchema = z.object({
  questionId: z.string().trim().min(1).max(120),
  selectedOption: z.string().trim().min(1).max(5_000),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  try {
    const userAnswers = await prisma.userAnswer.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(userAnswers);
  } catch (error) {
    console.error("Error fetching user answers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/user-answers
 *
 * Correctness is computed SERVER-SIDE from the stored question — the client
 * may not assert isCorrect (previously a user could mark any question correct,
 * polluting their own analytics).
 */
export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { questionId, selectedOption } = parsed.data;

    const question = await prisma.question.findUnique({
      where: { questionId },
      select: {
        type: true,
        options: true,
        correctOption: true,
        correctOptions: true,
        answerText: true,
        answerMin: true,
        answerMax: true,
      },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = gradeAnswer(question, selectedOption) ?? false;

    const userAnswer = await prisma.userAnswer.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId } },
      update: { selectedOption, isCorrect },
      create: { userId: session.user.id, questionId, selectedOption, isCorrect },
    });

    return NextResponse.json(userAnswer);
  } catch (error) {
    console.error("Error saving user answer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
