import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role, experience, motivation } = body

    // Validate input
    if (!name || !email || !role || !experience || !motivation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create new application
    const newApplication = await prisma.application.create({
      data: {
        name,
        email,
        role,
        experience,
        motivation,
        status: 'pending',
      },
    })

    return NextResponse.json(newApplication, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}