import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, customQuestions } = await req.json();

    // Ensure customQuestions have the correct format
    const formattedQuestions = customQuestions.map((question: any) => ({
      questionId: question.questionId,
      text: question.text,
      subject: question.subject,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      type: question.type,
      year: parseInt(question.year, 10),
      reviewed: question.reviewed,
      completed: question.completed,
      options: question.options,
      correctOption: question.correctOption,
      markscheme: question.markscheme,
      marks: question.marks || null,
      correctAttempts: question.correctAttempts || null,
      wrongAttempts: question.wrongAttempts || null,
      averageTimeTaken: question.averageTimeTaken || null,
      lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      diagramUrl: question.diagramUrl || null,
    }));

    const newBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        userId: session.user.id,
        customQuestions: {
          createMany: {
            data: formattedQuestions,
          },
        },
      },
      include: {
        customQuestions: true, // To ensure customQuestions are included in the response
      },
    });

    return NextResponse.json(newBank);
  } catch (error) {
    console.error("Error creating question bank:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
