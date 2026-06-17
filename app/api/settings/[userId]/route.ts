import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"
import { settingsSchema } from "@/lib/validations/settings"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.id !== (await params).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: (await params).userId },
  })
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 })
  }

  return NextResponse.json(settings)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.id !== (await params).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = settingsSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { username, email, bio, urls, name, language } = parsed.data

  const settings = await prisma.userSettings.upsert({
    where: { userId: (await params).userId },
    // Partial update: only the provided fields change.
    update: {
      username,
      email,
      bio,
      urls: urls as object | undefined,
      name,
      language,
    },
    // All columns are required, so fall back to empty values on first create.
    create: {
      id: crypto.randomUUID(),
      userId: (await params).userId,
      username: username ?? "",
      email: email ?? "",
      bio: bio ?? "",
      urls: (urls ?? []) as object,
      name: name ?? "",
      language: language ?? "",
    },
  })

  return NextResponse.json(settings)
}
