import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/options'
import IssuesPageContent from './IssuesPageContent'

async function getInitialIssues() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const response = await fetch(`${apiUrl}/api/issues`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch issues')
  }
  return response.json()
}

export default async function IssuesPageWrapper() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role?.name || 'member'
  let initialIssues = []
  
  try {
    initialIssues = await getInitialIssues()
  } catch (error) {
    console.error('Error fetching initial issues:', error)
    // You might want to add some error handling here, such as setting an error state
  }

  return <IssuesPageContent initialIssues={initialIssues} userRole={userRole} />
}