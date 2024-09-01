// app/api/user/delete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Manually delete related records if needed (for more control)
    await prisma.customQuestionBank.deleteMany({
      where: { userId: user.id },
    });

    // Delete the user (cascading deletes should handle the rest)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ message: "User data has been reset successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user data:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
