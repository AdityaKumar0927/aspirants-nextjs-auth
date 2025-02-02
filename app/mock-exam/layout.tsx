"use client"

import "../globals.css"
import { Suspense, useState } from "react"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Toaster } from "@/components/ui/toaster"
import { UserPerformanceProvider } from "@/components/layout/UserPerformanceContext"
import { Footer } from "@/components/layout/footer"

// --- Import your new sidebar-based layout and sub-components ---
import { SidebarLayout } from "@/components/administrator-ui/sidebar-layout"
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarSection,
  SidebarDivider,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
} from "@/components/administrator-ui/sidebar"

// --- For icons/buttons (e.g., user info, clock, etc.) ---
import { User, Clock, LogOut, AlertCircle, CheckCircle, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"

// Example user logic
const getUserId = () => null // Replace with your real auth logic

// You might want a function to format your exam time left
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = getUserId()

  // Example dummy data for the exam status, you might pass these from somewhere else
  const userName = "John Doe"
  const examTimeLeft = 1234
  const onExit = () => {
    // handle exit logic
    alert("Exiting exam")
  }

  // Example question status data
  const questionStatusCounts = {
    notVisited: 10,
    notAnswered: 5,
    answered: 7,
    markedForReview: 2,
  }
  // Suppose we have 24 total questions:
  const totalQuestions = 24
  // We'll just pretend they all have "notVisited" statuses except the first two:
  const questionStatuses: Record<number, string> = {
    0: "answered",
    1: "markedForReview",
    // others default to "notVisited"
  }
  // We'll do a no-op for onNavigate:
  const onNavigate = (index: number) => {
    alert(`Navigate to question #${index + 1}`)
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Your mathjax / fontawesome / etc. <link> and <script> tags here */}
      </head>

      <body>
        <UserPerformanceProvider userId={userId}>
          <TooltipProvider>
            {/* Wrap entire page in your sidebar layout */}
            <SidebarLayout
              // The "navbar" is what appears on top for mobile (and is hidden on large screens).
              // We'll show user info, clock, exit button in that area.
              navbar={
                <div className="flex items-center justify-between w-full py-2 px-2">
                  {/* Left side: user info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">Exam Mode</p>
                    </div>
                  </div>
                  {/* Right side: timer + exit */}
                  <div className="flex items-center space-x-2">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(examTimeLeft)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onExit}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              }
              // The "sidebar" is what appears pinned on the left for desktop, and slides out on mobile.
              sidebar={
                <Sidebar className="border-r border-zinc-200 dark:border-zinc-800">
                  <SidebarHeader>
                    {/* If you want a logo or top section */}
                    <SidebarSection>
                      <SidebarHeading>Exam Sidebar</SidebarHeading>
                    </SidebarSection>
                  </SidebarHeader>

                  <SidebarBody>
                    {/* Example: Question Status */}
                    <SidebarSection>
                      <SidebarHeading>Question Status</SidebarHeading>
                      <div className="flex flex-col text-sm px-2 py-1 space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span>Not Visited</span>
                          </div>
                          <span>{questionStatusCounts.notVisited}</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span>Not Answered</span>
                          </div>
                          <span>{questionStatusCounts.notAnswered}</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Answered</span>
                          </div>
                          <span>{questionStatusCounts.answered}</span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <Flag className="w-4 h-4 text-blue-500" />
                            <span>Marked</span>
                          </div>
                          <span>{questionStatusCounts.markedForReview}</span>
                        </div>
                      </div>
                    </SidebarSection>

                    <SidebarDivider />

                    {/* Example: Question Navigator */}
                    <SidebarSection>
                      <SidebarHeading>Question Navigator</SidebarHeading>
                      <div className="grid grid-cols-5 gap-2 mt-2 px-2">
                        {Array.from({ length: totalQuestions }, (_, index) => {
                          const status = questionStatuses[index] ?? "notVisited"
                          // Some color logic
                          let bg = "bg-white text-gray-600 border-gray-300"
                          if (status === "answered") {
                            bg = "bg-green-100 text-green-600 border-green-600"
                          } else if (status === "markedForReview") {
                            bg = "bg-blue-100 text-blue-600 border-blue-600"
                          } else if (status === "notAnswered") {
                            bg = "bg-yellow-100 text-yellow-600 border-yellow-600"
                          }
                          return (
                            <SidebarItem
                              key={index}
                              className={`border ${bg} p-0 justify-center items-center`}
                              onClick={() => onNavigate(index)}
                            >
                              <SidebarLabel>{index + 1}</SidebarLabel>
                            </SidebarItem>
                          )
                        })}
                      </div>
                    </SidebarSection>
                  </SidebarBody>

                  <SidebarFooter>
                    {/* You can put something at the bottom if needed */}
                    <SidebarSection>
                      <p className="text-xs text-center text-gray-400">
                        &copy; 2025 Aspirants
                      </p>
                    </SidebarSection>
                  </SidebarFooter>
                </Sidebar>
              }
            >
              {/* children -> The main exam page content renders here */}
              <Suspense fallback="Loading exam...">
                {children}
              </Suspense>
            </SidebarLayout>

            {/* Possibly you still want a Footer below the main content? (If not, remove) */}
            <Footer />

            {/* Vercel Analytics, Toast, etc. */}
            <VercelAnalytics />
            <Toaster />
          </TooltipProvider>
        </UserPerformanceProvider>
      </body>
    </html>
  )
}
