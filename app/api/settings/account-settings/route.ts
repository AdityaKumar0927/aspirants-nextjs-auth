import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

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

  const data = await request.json()
  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: { name: data.name, language: data.language },
    create: {
      userId: session.user.id,
      name: data.name,
      language: data.language,
      username: "",
      email: "",
      bio: "",
      urls: "",
      id: crypto.randomUUID(),
    },
  })

  return NextResponse.json(settings)
}
