'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QuestionProvider } from './QuestionContext'
import { QuestionBankDashboardContent } from './QuestionBankDashboardContent'

const queryClient = new QueryClient()

export function QuestionBankDashboardWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <QuestionProvider>
        <QuestionBankDashboardContent />
      </QuestionProvider>
    </QueryClientProvider>
  )
}