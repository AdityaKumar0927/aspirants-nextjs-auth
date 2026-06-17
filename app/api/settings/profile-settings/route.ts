import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { settingsSchema } from "@/lib/validations/settings"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  })
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 })
  }

  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = settingsSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { username, email, bio, urls } = parsed.data

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    // Partial update: only the provided fields change.
    update: {
      username,
      email,
      bio,
      urls: urls as object | undefined,
    },
    create: {
      userId: session.user.id,
      username: username ?? "",
      email: email ?? "",
      bio: bio ?? "",
      urls: (urls ?? []) as object,
      name: "",
      language: "",
      id: crypto.randomUUID(),
    },
  })

  return NextResponse.json(settings)
}
