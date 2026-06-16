import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Admin-only: list all users for the role-management console. Uses the shared
// requireAdmin() guard (session role, kept in sync via the jwt callback) rather
// than a bespoke DB role lookup, so it can't drift from the canonical check.
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        UserRole: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
