import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import authOptions from '../../auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    // Fetch the current user's role from the database
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    })

    // Ensure the current user is an administrator
    if (!currentUser?.role || currentUser.role.name !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can update user roles' }, { status: 403 })
    }

    const { userId, roleName } = await request.json()

    if (!userId || !roleName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the role ID for the given role name
    const role = await prisma.userRole.findUnique({
      where: { name: roleName.toLowerCase() },
    })

    if (!role) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    // Prevent administrators from changing their own role
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Administrators cannot change their own role' }, { status: 403 })
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: true },
    })

    return NextResponse.json({ 
      message: 'User role updated successfully', 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role?.name,
      }
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}