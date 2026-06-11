import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import prisma from "@/lib/prisma"

const settingsSchema = z.object({
  username: z.string().trim().max(100).optional(),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  bio: z.string().max(2_000).optional(),
  name: z.string().trim().max(200).optional(),
  language: z.string().trim().max(40).optional(),
  // urls is a Json column; bound its serialized size.
  urls: z
    .unknown()
    .optional()
    .refine(
      (v) => v === undefined || JSON.stringify(v).length <= 5_000,
      "urls payload too large"
    ),
})

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

  const parsed = settingsSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { username, email, bio, urls, name, language } = parsed.data

  const settings = await prisma.userSettings.upsert({
    where: { userId: params.userId },
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
      userId: params.userId,
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
