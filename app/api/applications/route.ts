import { NextResponse } from "next/server"
import { ApplicationRole } from "@prisma/client"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { rateLimit, assertSameOrigin } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const applicationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  role: z.string().trim().max(50).optional(),
  experience: z.string().trim().min(50).max(1000),
  motivation: z.string().trim().min(50).max(1000),
  honeypot: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request)
    if (csrf) return csrf

    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limited = await rateLimit(request, "application", { limit: 3, windowSec: 600 }, session.user.id)
    if (limited) return limited

    const parsed = applicationSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 })
    }
    const { name, email, role, experience, motivation, honeypot } = parsed.data

    // Check honeypot field
    if (honeypot) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
    }

    // Prevent queue spam: one pending application per user at a time.
    const pending = await prisma.application.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      select: { id: true },
    })
    if (pending) {
      return NextResponse.json({ error: "You already have a pending application." }, { status: 409 })
    }

    // Public applications are for VOLUNTEERS only. Moderators are promoted from
    // active volunteers by an admin (see /api/user/role), so reject anything else.
    if (role && String(role).toUpperCase() === "MODERATOR") {
      return NextResponse.json(
        { error: "Moderator applications aren't open — moderators are chosen from active volunteers." },
        { status: 400 }
      )
    }
    const applicationRole: ApplicationRole = ApplicationRole.VOLUNTEER

    // Create new application
    const newApplication = await prisma.application.create({
      data: {
        name,
        email,
        role: applicationRole,
        experience,
        motivation,
        status: "PENDING",
        User: {
          connect: {
            email: session.user.email!,
          },
        },
      },
    })

    // Log the submission for monitoring
    console.log(`New application submitted: ${newApplication.id}`)

    return NextResponse.json({
      message: "Application submitted successfully",
      id: newApplication.id,
    })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
