// File: /app/api/topics/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examParam = searchParams.get("exam");
    const yearStr = searchParams.get("year");

    if (!examParam || !yearStr) {
      return NextResponse.json({ topics: [] });
    }

    const yearNum = parseInt(yearStr, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json({ topics: [] });
    }

    // Example: group by "topic" if not null
    const groupRows = await prisma.question.groupBy({
      by: ["topic"],
      where: {
        exam: examParam,
        year: yearNum,
        topic: { not: null },
      },
      _count: {
        topic: true,
      },
    });

    // Build an array of { id, name, questions }
    const topics = groupRows.map((g, i) => ({
      id: i + 1, // or some unique generation
      name: g.topic || "Unnamed Topic",
      questions: g._count.topic,
    }));

    return NextResponse.json({ topics });
  } catch (err) {
    console.error("GET /api/topics =>", err);
    return NextResponse.json({ topics: [] }, { status: 500 });
  }
}
