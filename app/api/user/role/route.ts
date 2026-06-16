import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/user/role  (administrator only)
 *
 * Assigns a role to a user. Guards:
 *  - administrators only (capability/role enforced by requireAdmin),
 *  - cannot change your own role,
 *  - cannot demote the LAST administrator (would lock everyone out),
 *  - every change is written to the audit log (actor + from/to role).
 */
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const { userId, roleName } = await request.json();
    if (!userId || !roleName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const role = await prisma.userRole.findUnique({
      where: { name: String(roleName).toLowerCase() },
    });
    if (!role) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Administrators cannot change their own role" },
        { status: 403 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { UserRole: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const fromRole = target.UserRole?.name ?? "member";

    // Moderators are promoted FROM volunteers only — a member can't jump
    // straight to moderator. (Allow re-assigning to an existing moderator.)
    if (role.name === "moderator" && fromRole !== "volunteer" && fromRole !== "moderator") {
      return NextResponse.json(
        {
          error:
            "Only volunteers can be promoted to moderators. Assign the volunteer role first.",
        },
        { status: 409 }
      );
    }

    // Last-administrator protection.
    if (fromRole === "administrator" && role.name !== "administrator") {
      const adminCount = await prisma.user.count({
        where: { UserRole: { name: "administrator" } },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last administrator. Promote another admin first." },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { UserRole: true },
    });

    await logAudit({
      userId: session.user.id,
      action: "ROLE_CHANGED",
      metadata: { targetUserId: userId, from: fromRole, to: role.name },
      req: request,
    });

    return NextResponse.json({
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.UserRole?.name,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
