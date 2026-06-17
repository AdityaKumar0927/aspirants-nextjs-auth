import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { settingsSchema } from "@/lib/validations/settings"

export async function GET() {
  const session = await auth()
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
  const session = await auth()
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
  const { name, language } = parsed.data

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: { name, language },
    create: {
      userId: session.user.id,
      name: name ?? "",
      language: language ?? "",
      username: "",
      email: "",
      bio: "",
      urls: "",
      id: crypto.randomUUID(),
    },
  })

  return NextResponse.json(settings)
}
