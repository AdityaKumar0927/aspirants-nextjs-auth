"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface Application {
  id: string
  name: string
  email: string
  role: 'volunteer' | 'moderator'
  experience: string
  motivation: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications')
      if (!response.ok) throw new Error('Failed to fetch applications')
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch applications. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update application status')

      setApplications(applications.map(app => 
        app.id === id ? { ...app, status } : app
      ))

      toast({
        title: "Status Updated",
        description: `Application ${status} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Application Management</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Applied</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell>{application.name}</TableCell>
              <TableCell>{application.email}</TableCell>
              <TableCell>{application.role}</TableCell>
              <TableCell>
                <Badge variant={application.status === 'pending' ? 'outline' : application.status === 'approved' ? 'default' : 'destructive'}>
                  {application.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">View</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{application.name}&apos;s Application</DialogTitle>
                      <DialogDescription>Application for {application.role} role</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      <p><strong>Experience:</strong> {application.experience}</p>
                      <p><strong>Motivation:</strong> {application.motivation}</p>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                      <Button
                        onClick={() => handleStatusUpdate(application.id, 'approved')}
                        disabled={application.status !== 'pending'}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                        variant="destructive"
                        disabled={application.status !== 'pending'}
                      >
                        Reject
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}