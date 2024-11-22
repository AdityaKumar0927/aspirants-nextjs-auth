// app/issues/page.tsx
import IssuesPageContent from './IssuesPageContent'
import { getIssues } from '@/lib/getIssues'

export default async function IssuesPage() {
  const initialIssues = await getIssues()
  return <IssuesPageContent initialIssues={initialIssues} />
}