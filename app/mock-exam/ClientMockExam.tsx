'use client'

import { SessionProvider } from "next-auth/react"
import MockExamContent from "./MockExamContent"

export default function ClientMockExam() {
  return (
    <SessionProvider>
      <MockExamContent />
    </SessionProvider>
  )
}