import { NextResponse } from "next/server"
import { PrismaClient, ApplicationRole } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import authOptions from "../auth/[...nextauth]/options"

const prisma = new PrismaClient()

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, role, experience, motivation, honeypot } = body

    // Check honeypot field
    if (honeypot) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
    }

    // Validate input
    if (!name || !email || !role || !experience || !motivation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Enhanced input validation
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters" }, { status: 400 })
    }
    if (experience.length < 50 || experience.length > 1000) {
      return NextResponse.json({ error: "Experience must be between 50 and 1000 characters" }, { status: 400 })
    }
    if (motivation.length < 50 || motivation.length > 1000) {
      return NextResponse.json({ error: "Motivation must be between 50 and 1000 characters" }, { status: 400 })
    }

    // Validate and convert role to enum
    let applicationRole: ApplicationRole
    if (role.toUpperCase() === "VOLUNTEER") {
      applicationRole = ApplicationRole.VOLUNTEER
    } else if (role.toUpperCase() === "MODERATOR") {
      applicationRole = ApplicationRole.MODERATOR
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

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
  } finally {
    await prisma.$disconnect()
  }
}
