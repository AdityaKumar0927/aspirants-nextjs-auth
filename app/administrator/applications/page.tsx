"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter } from 'lucide-react'

interface Application {
  id: string
  name: string
  email: string
  role: 'VOLUNTEER' | 'MODERATOR'
  experience: string
  motivation: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  userId: string // Add this field
}

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const router = useRouter()

  const applicationsPerPage = 10

  useEffect(() => {
    if (status === 'unauthenticated' || (session?.user?.role !== 'administrator')) {
      router.push('/unauthorized')
    } else if (status === 'authenticated' && session?.user?.role === 'administrator') {
      fetchApplications()
    }
  }, [status, session, router])

  useEffect(() => {
    const filtered = applications.filter(app => 
      (app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       app.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'ALL' || app.status === statusFilter)
    )
    setFilteredApplications(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, applications])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications')
      if (!response.ok) throw new Error('Failed to fetch applications')
      const data = await response.json()
      setApplications(data)
      setFilteredApplications(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch applications. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update application status')

      const updatedApplication = await response.json()

      if (status === 'APPROVED') {
        await updateUserRole(updatedApplication.userId, updatedApplication.role)
      }

      setApplications(applications.map(app => 
        app.id === id ? { ...app, status } : app
      ))

      toast({
        title: "Status Updated",
        description: `Application ${status.toLowerCase()} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateUserRole = async (userId: string, roleName: string) => {
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleName }),
      })

      if (!response.ok) throw new Error('Failed to update user role')

      const data = await response.json()
      toast({
        title: "Role Updated",
        description: `User role updated to ${data.user.role} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (status === 'unauthenticated' || (session?.user?.role !== 'administrator')) {
    return null
  }

  const indexOfLastApplication = currentPage * applicationsPerPage
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Application Management</CardTitle>
          <CardDescription>Review and manage volunteer and moderator applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="border rounded-md p-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
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
              {currentApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.name}</TableCell>
                  <TableCell>{application.email}</TableCell>
                  <TableCell>{application.role.toLowerCase()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">View</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{application.name}&apos;s Application</DialogTitle>
                          <DialogDescription>Application for {application.role.toLowerCase()} role</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <p><strong>Experience:</strong> {application.experience}</p>
                          <p><strong>Motivation:</strong> {application.motivation}</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                          <Button
                            onClick={() => handleStatusUpdate(application.id, 'APPROVED')}
                            disabled={application.status !== 'PENDING'}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(application.id, 'REJECTED')}
                            variant="destructive"
                            disabled={application.status !== 'PENDING'}
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
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                {currentPage > 1 ? (
                  <PaginationPrevious onClick={() => paginate(currentPage - 1)} />
                ) : (
                  <PaginationItem>
                    <span className="opacity-50 cursor-not-allowed">Previous</span>
                  </PaginationItem>
                )}
              </PaginationItem>
              {Array.from({ length: Math.ceil(filteredApplications.length / applicationsPerPage) }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink onClick={() => paginate(index + 1)} isActive={currentPage === index + 1}>
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                {currentPage < Math.ceil(filteredApplications.length / applicationsPerPage) ? (
                  <PaginationNext onClick={() => paginate(currentPage + 1)} />
                ) : (
                  <PaginationItem>
                    <span className="opacity-50 cursor-not-allowed">Next</span>
                  </PaginationItem>
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  )
}