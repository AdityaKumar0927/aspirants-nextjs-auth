import IssuesPageContent from './IssuesPageContent'

export default async function IssuesPage() {
  const initialIssues = await fetch('/api/issues').then(res => res.json())

  return <IssuesPageContent initialIssues={initialIssues} />
}

