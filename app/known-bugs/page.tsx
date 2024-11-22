import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Bug, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

type BugStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

interface Bug {
  id: number
  title: string
  description: string
  status: BugStatus
  tags: string[]
}

const statusIcons: Record<BugStatus, React.ReactNode> = {
  'open': <AlertCircle className="h-5 w-5 text-yellow-500" />,
  'in-progress': <Bug className="h-5 w-5 text-blue-500" />,
  'resolved': <CheckCircle2 className="h-5 w-5 text-green-500" />,
  'closed': <XCircle className="h-5 w-5 text-gray-500" />
}

const statusColors: Record<BugStatus, string> = {
  'open': 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'resolved': 'bg-green-100 text-green-800',
  'closed': 'bg-gray-100 text-gray-800'
}

const knownBugs: Bug[] = [
  {
    id: 1,
    title: "Login button unresponsive on mobile",
    description: "Users report that the login button doesn't work on mobile devices.",
    status: "open",
    tags: ["mobile", "authentication"]
  },
  {
    id: 2,
    title: "Incorrect calculation in test scores",
    description: "Test scores are being calculated incorrectly for multiple-choice questions.",
    status: "in-progress",
    tags: ["scoring", "tests"]
  },
  {
    id: 3,
    title: "Broken images in study materials",
    description: "Some images in the Biology study materials are not loading properly.",
    status: "resolved",
    tags: ["content", "images"]
  },
  {
    id: 4,
    title: "Outdated information in Chemistry module",
    description: "The periodic table in the Chemistry module is missing recently discovered elements.",
    status: "closed",
    tags: ["content", "chemistry"]
  }
]

export function KnownBugsTracker() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Known Issues Tracker</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {knownBugs.map((bug) => (
          <Card key={bug.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {statusIcons[bug.status]}
                <span>{bug.title}</span>
              </CardTitle>
              <CardDescription>
                <Badge className={`${statusColors[bug.status]}`}>
                  {bug.status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{bug.description}</p>
              <div className="flex flex-wrap gap-2">
                {bug.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

