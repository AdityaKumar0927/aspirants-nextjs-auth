import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { isStaff, requireSession } from "@/lib/auth";

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().min(1).max(10_000).optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    area: z.enum(["CONTENT", "UI", "BUG", "FEATURE", "OTHER"]).optional(),
  })
  .strict();

// Triage fields only staff may change (a reporter may only edit their own text).
const STAFF_ONLY_FIELDS = ["status", "priority", "area"] as const;

/**
 * GET /api/issues/[id] — visible to the issue's owner or staff.
 * Never returns the reporter's full User record (only id/name/image).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: (await params).id },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        question: { select: { questionId: true, text: true } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    if (issue.createdById !== session.user.id && !isStaff(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: (await params).id },
      select: { createdById: true },
    });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const owner = issue.createdById === session.user.id;
    const staff = isStaff(session);
    if (!owner && !staff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Non-staff owners may only edit their own title/description.
    const touchesStaffFields = STAFF_ONLY_FIELDS.some(
      (f) => parsed.data[f] !== undefined
    );
    if (touchesStaffFields && !staff) {
      return NextResponse.json(
        { error: "Only staff can change status, priority or area" },
        { status: 403 }
      );
    }

    const updated = await prisma.issue.update({
      where: { id: (await params).id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: (await params).id },
      select: { createdById: true },
    });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    if (issue.createdById !== session.user.id && !isStaff(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.issue.delete({ where: { id: (await params).id } });
    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
