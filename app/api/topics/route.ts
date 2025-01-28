// /app/api/topics/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exam = searchParams.get("exam");
    const yearStr = searchParams.get("year");
    if (!exam || !yearStr) {
      return NextResponse.json({ topics: [] });
    }
    const yearNum = parseInt(yearStr, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ topics: [] });
    }

    // We'll do a groupBy on "topic"
    // If "topic" is null, skip it
    const groupRows = await prisma.question.groupBy({
      by: ["topic"],
      where: {
        exam,
        year: yearNum,
        topic: { not: null },
      },
      _count: {
        topic: true,
      },
    });

    // We map each group to { id, name, questions }
    // No actual 'id' in DB for topic, so we can generate an artificial one
    const topics = groupRows.map((g, i) => ({
      id: i + 1, // or create a hash from topic name
      name: g.topic || "Unnamed Topic",
      questions: g._count.topic, // # of questions in that topic
    }));

    return NextResponse.json({ topics });
  } catch (err) {
    console.error("GET /api/topics =>", err);
    return NextResponse.json({ topics: [] }, { status: 500 });
  }
}
