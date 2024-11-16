import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ApplyClientWrapper = dynamic(() => import('./ApplyClientWrapper'), {
  ssr: false,
  loading: () => <Loader2 className="h-8 w-8 animate-spin" />
})

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