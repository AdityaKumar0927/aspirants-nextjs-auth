import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ErrorBoundary from '../components/ErrorBoundary'

const ApplyClientWrapper = dynamic(() => import('./ApplyClientWrapper'), {
  ssr: false,
  loading: () => <Loader2 className="h-8 w-8 animate-spin" />
})

export default function ApplyPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Volunteer/Moderator Application</h1>
      <ErrorBoundary fallback={<Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>An unexpected error occurred. Please try refreshing the page.</AlertDescription>
      </Alert>}>
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
          <ApplyClientWrapper />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}