import { NextResponse } from 'next/server'
import { PrismaClient, ApplicationRole } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import authOptions from '../auth/[...nextauth]/options'
import rateLimit from 'express-rate-limit'
import { verify } from 'hcaptcha'

const prisma = new PrismaClient()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const res = await new Promise<Error | undefined>((resolve) => {
      limiter(request as any, {} as any, (result: Error | undefined) => {
        resolve(result)
      })
    })

    if (res instanceof Error) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, role, experience, motivation, captchaToken, honeypot } = body

    // Check honeypot field
    if (honeypot) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }

    // Validate CAPTCHA
    const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY
    if (!hcaptchaSecret) {
      throw new Error('HCAPTCHA_SECRET_KEY is not set')
    }

    const captchaResult = await verify(hcaptchaSecret, captchaToken)
    if (!captchaResult.success) {
      return NextResponse.json({ error: 'CAPTCHA validation failed' }, { status: 400 })
    }

    // Validate input
    if (!name || !email || !role || !experience || !motivation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Enhanced input validation
    if (name.length > 100 || experience.length > 1000 || motivation.length > 1000) {
      return NextResponse.json({ error: 'Input exceeds maximum length' }, { status: 400 })
    }

    // Validate and convert role to enum
    let applicationRole: ApplicationRole
    if (role.toUpperCase() === 'VOLUNTEER') {
      applicationRole = ApplicationRole.VOLUNTEER
    } else if (role.toUpperCase() === 'MODERATOR') {
      applicationRole = ApplicationRole.MODERATOR
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create new application
    const newApplication = await prisma.application.create({
      data: {
        name,
        email,
        role: applicationRole,
        experience,
        motivation,
        status: 'PENDING',
        user: {
          connect: {
            email: session.user.email!
          }
        }
      },
    })

    // Log the submission for monitoring
    console.log(`New application submitted: ${newApplication.id}`)

    return NextResponse.json(newApplication)
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}