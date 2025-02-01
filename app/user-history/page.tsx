"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface UserMockExam {
  id: string
  exam: string | null
  year: number | null
  shift: string | null
  createdAt: string
  completed: boolean
}

export default function UserHistoryPage() {
  const { data: session, status } = useSession()
  const [attempts, setAttempts] = useState<UserMockExam[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAttempts() {
      try {
        setIsLoading(true)
        setErrorMsg(null)
        const res = await fetch("/api/mock-exams")
        if (!res.ok) {
          throw new Error("Failed to load exam attempts")
        }
        const data = await res.json()
        setAttempts(data.data || [])
      } catch (error: any) {
        console.error(error)
        setErrorMsg(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchAttempts()
    }
  }, [status])

  if (status === "unauthenticated") {
    return (
      <div className="p-6">
        <p>You must log in to view your exam history.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold mb-4">My Exam History</h1>
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
      {errorMsg && <p className="text-red-500">{errorMsg}</p>}
      {!isLoading && attempts && attempts.length === 0 && (
        <p className="italic text-gray-500">No exam attempts found.</p>
      )}
      {!isLoading && attempts && attempts.length > 0 && (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card key={attempt.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {attempt.exam || "Unknown Exam"} - {attempt.year || "N/A"}{" "}
                  {attempt.shift && `(${attempt.shift})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Created: {new Date(attempt.createdAt).toLocaleString()}
                  <br />
                  {attempt.completed ? (
                    <span className="text-green-600">Completed</span>
                  ) : (
                    <span className="text-orange-600">In Progress</span>
                  )}
                </div>
                {/* 
                  If you want a details page: 
                  e.g. /user-history/[attemptId] => 
                  you can fetch /api/mock-exams/[attemptId] 
                  and show the results 
                */}
                <Link href={`/user-history/${attempt.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
