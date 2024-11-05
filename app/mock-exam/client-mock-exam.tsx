"use client"

import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"
import MockExam from "./mock-exam"

interface ClientMockExamProps {
  session: Session | null
}

export default function ClientMockExam({ session }: ClientMockExamProps) {
  return (
    <SessionProvider session={session}>
      <MockExam />
    </SessionProvider>
  )
}