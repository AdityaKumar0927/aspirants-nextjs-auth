import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examParam = searchParams.get("exam");
    const yearParam = searchParams.get("year");

    // 1) No exam => distinct exam
    if (!examParam) {
      const rows = await prisma.question.findMany({
        distinct: ["exam"],
        where: { exam: { not: null } },
        select: { exam: true },
      });
      const exams = rows.map((r) => r.exam!).filter(Boolean).sort();
      return NextResponse.json({ exams });
    }

    // 2) exam but no year => distinct years
    if (examParam && !yearParam) {
      const rows = await prisma.question.findMany({
        distinct: ["year"],
        where: {
          exam: examParam,
          year: { not: null },
        },
        select: { year: true },
      });
      const years = rows.map((r) => r.year!).filter(Boolean).sort((a, b) => a - b);
      return NextResponse.json({ years });
    }

    // 3) exam + year => distinct key => shifts
    if (examParam && yearParam) {
      const parsedYear = parseInt(yearParam, 10);
      if (isNaN(parsedYear)) {
        return NextResponse.json({ shifts: [] });
      }

      const rows = await prisma.question.findMany({
        distinct: ["key"],
        where: {
          exam: examParam,
          year: parsedYear,
          key: { not: null },
        },
        select: { key: true },
      });
      const shifts = rows.map((r) => r.key!).filter(Boolean).sort();
      return NextResponse.json({ shifts });
    }

    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  } catch (err: any) {
    console.error("GET /api/exams-and-years =>", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
