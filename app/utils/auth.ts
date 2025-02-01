// utils/auth.ts
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Authorization check function
export const checkAuthorization = async (
  req: NextApiRequest,
  allowedRoles: string[]
): Promise<boolean> => {
  const session = await getSession({ req })

  if (!session || !session.user?.email) {
    return false
  }

  // Use UserRole instead of role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { UserRole: true },
  })

  // Check if user exists and if user.UserRole?.name is in the allowed roles
  return Boolean(user && allowedRoles.includes(user.UserRole?.name || ''))
}
