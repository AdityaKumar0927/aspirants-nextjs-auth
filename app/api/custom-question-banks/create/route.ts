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

    console.log("Received data:", { name, description, customQuestions });

    const newBank = await prisma.customQuestionBank.create({
      data: {
        name,
        description,
        userId: session.user.id,
        customQuestions: {
          create: customQuestions.map((question: any) => ({
            questionId: question.questionId,
            text: question.text,
            subject: question.subject,
            topic: question.topic,
            subtopic: question.subtopic,
            difficulty: question.difficulty,
            type: question.type,
            year: question.year,
            reviewed: question.reviewed,
            completed: question.completed,
            options: question.options,
            correctOption: question.correctOption,
            markscheme: question.markscheme,
            marks: question.marks,
            correctAttempts: question.correctAttempts,
            wrongAttempts: question.wrongAttempts,
            averageTimeTaken: question.averageTimeTaken,
            lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
            diagramUrl: question.diagramUrl,
          })),
        },
      },
    });

    console.log("New Bank Created:", newBank);
    return NextResponse.json(newBank);
  } catch (error) {
    console.error("Error creating question bank:", error);
    return NextResponse.json({ error: "Error creating question bank" }, { status: 500 });
  }
}
