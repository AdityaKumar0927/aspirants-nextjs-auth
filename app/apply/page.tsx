import { Suspense } from 'react'
import ApplyClientWrapper from './ApplyClientWrapper'
import { Loader2 } from 'lucide-react'

export default function ApplyPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Volunteer/Moderator Application</h1>
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <ApplyClientWrapper />
      </Suspense>
    </div>
  )
}