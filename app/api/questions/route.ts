import { NextResponse } from "next/server";
import { PrismaClient, QuestionStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Utility to parse comma-separated query params:
 * e.g. "JEE,NEET" => ["JEE", "NEET"]
 */
function parseCommaParam(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * GET /api/questions
 *
 * Optional Query parameters:
 *   ?exam=JEE,NEET
 *   &subject=Physics,Chemistry
 *   &difficulty=Easy,Medium
 *   &year=2021,2022
 *   &type=Multiple Choice,Numerical
 *   &yearKey=JEE-2023-Shift1
 *   &page=1
 *   &pageSize=20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 1) Pagination
    const pageParam = searchParams.get("page") || "1";
    const pageSizeParam = searchParams.get("pageSize") || "10";
    const page = parseInt(pageParam, 10) || 1;
    const pageSize = parseInt(pageSizeParam, 10) || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 2) Parse multi-value filters
    const examArr       = parseCommaParam(searchParams.get("exam"));
    const subjectArr    = parseCommaParam(searchParams.get("subject"));
    const topicArr      = parseCommaParam(searchParams.get("topic"));
    const subtopicArr   = parseCommaParam(searchParams.get("subtopic"));
    const difficultyArr = parseCommaParam(searchParams.get("difficulty"));
    const yearStrArr    = parseCommaParam(searchParams.get("year"));
    const typeArr       = parseCommaParam(searchParams.get("type"));
    const yearKeyArr    = parseCommaParam(searchParams.get("yearKey"));

    // 3) Build Prisma WHERE object
    const where: any = {};

    if (examArr)        where.exam       = { in: examArr };
    if (subjectArr)     where.subject    = { in: subjectArr };
    if (topicArr)       where.topic      = { in: topicArr };
    if (subtopicArr)    where.subtopic   = { in: subtopicArr };
    if (difficultyArr)  where.difficulty = { in: difficultyArr };
    if (typeArr)        where.type       = { in: typeArr };
    if (yearKeyArr)     where.yearKey    = { in: yearKeyArr };

    if (yearStrArr) {
      const years = yearStrArr
        .map((y) => parseInt(y, 10))
        .filter((n) => !isNaN(n));
      if (years.length) {
        where.year = { in: years };
      }
    }

    // 4) Fetch matching questions + total count
    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        skip,
        take,
        where,
        orderBy: { id: "asc" },
        include: {
          // If you have related tables, include them as needed:
          Exam: true,
          Feedback: true,
          Issue: true,
          Note: true,
          UserAnswer: true,
          UserPerformance: true,
          UserProgress: true,

          // For a parent question relation (if any):
          Question: true,
          // For child questions:
          other_Question: true,
        },
      }),
      prisma.question.count({ where }),
    ]);

    // 5) Convert customTag CSV -> array
    const data = questions.map((q) => {
      let customTags: string[] = [];
      if (q.customTag) {
        customTags = q.customTag.split(",").map((tag) => tag.trim());
      }
      return {
        ...q,
        customTags,
        // IMPORTANT: we keep "explanation" as is—no rename to "markscheme"
      };
    });

    return NextResponse.json({
      data,
      currentPage: page,
      pageSize,
      totalCount,
    });
  } catch (error) {
    console.error("Error in GET /api/questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions
 *
 * Body example:
 * {
 *   "questionId": "Q123",
 *   "text": "Which is correct?",
 *   "options": ["A) ...","B) ..."],
 *   "correctOption": "A",
 *   "exam": "JEE",
 *   "subject": "Physics",
 *   "explanation": "Your explanation here!",
 *   "customTags": ["tag1","tag2"],
 *   ...
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("POST /api/questions => creating question", data);

    // DO NOT rename explanation => markscheme; we just keep data.explanation

    // Convert customTags array -> CSV if needed
    if (Array.isArray(data.customTags)) {
      data.customTag = data.customTags.join(",");
      delete data.customTags;
    }

    // default status if not provided
    const status = data.status || QuestionStatus.ACTIVE;

    const created = await prisma.question.create({
      data: {
        ...data,
        status,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/questions
 *
 * Body example:
 * {
 *   "questionId": "Q123",
 *   "completed": true,
 *   "reviewed": false,
 *   "explanation": "Updated explanation text",
 *   "customTags": ["tag1","tag2"]
 * }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log("PATCH /api/questions => updating question", body);

    const { questionId, ...rest } = body;
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    // DO NOT rename explanation => markscheme; keep it as rest.explanation

    // If array of customTags => store as CSV
    if (Array.isArray(rest.customTags)) {
      rest.customTag = rest.customTags.join(",");
      delete rest.customTags;
    }

    const updated = await prisma.question.update({
      where: { questionId },
      data: rest,
    });

    // Re-parse customTag => customTags array
    let customTags: string[] = [];
    if (updated.customTag) {
      customTags = updated.customTag.split(",").map((t) => t.trim());
    }

    return NextResponse.json({
      ...updated,
      customTags,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions
 *
 * Body example:
 * {
 *   "questionId": "Q123"
 * }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    console.log("DELETE /api/questions => removing question", body);

    const { questionId } = body;
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    await prisma.question.delete({ where: { questionId } });
    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
