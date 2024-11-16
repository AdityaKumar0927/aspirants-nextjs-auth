"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QuestionBankDashboardContent } from './QuestionBankDashboardContent'

// Create a client
const queryClient = new QueryClient()

export default function QuestionBankDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <QuestionBankDashboardContent />
    </QueryClientProvider>
  )
}