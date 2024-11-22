import IssuesPageContent from './IssuesPageContent'

export default async function IssuesPage() {
  // Use absolute URL for server-side fetching
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const initialIssues = await fetch(`${baseUrl}/api/issues`, {
    // Add cache options as needed
    cache: 'no-store', // or 'force-cache' for static data
  }).then(res => res.json())

  return <IssuesPageContent initialIssues={initialIssues} />
}

