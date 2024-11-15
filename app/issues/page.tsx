import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/options'
import IssuesPageContent from './IssuesPageContent'

async function getInitialIssues() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/issues`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch issues')
  }
  return response.json()
}

export default async function IssuesPage() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role?.name || 'member'
  const initialIssues = await getInitialIssues()

  return <IssuesPageContent initialIssues={initialIssues} userRole={userRole} />
}