import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.id !== params.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: params.userId },
  })
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 })
  }

  return NextResponse.json(settings)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.id !== params.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()
  const settings = await prisma.userSettings.upsert({
    where: { userId: params.userId },
    update: {
      username: data.username,
      email: data.email,
      bio: data.bio,
      urls: data.urls,
      name: data.name,
      language: data.language,
    },
    create: {
      userId: params.userId,
      username: data.username,
      email: data.email,
      bio: data.bio,
      urls: data.urls,
      name: data.name,
      language: data.language,
      id: crypto.randomUUID(), 
    },
  })

  return NextResponse.json(settings)
}
