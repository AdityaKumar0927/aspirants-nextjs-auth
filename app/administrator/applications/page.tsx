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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, ChevronRight, ChevronLeft } from 'lucide-react'

interface Application {
  id: string
  name: string
  email: string
  role: 'VOLUNTEER' | 'MODERATOR'
  experience: string
  motivation: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  userId: string
}

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDetailView, setIsDetailView] = useState(false)
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
      setSelectedApplication(prev => prev && prev.id === id ? { ...prev, status } : prev)

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
          <div className="flex flex-col lg:flex-row gap-6">
            <div className={`w-full ${isDetailView ? 'lg:w-1/2' : 'lg:w-full'}`}>
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
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ScrollArea className="h-[600px] w-full">
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
                      <TableRow key={application.id} className="cursor-pointer hover:bg-gray-100" onClick={() => {
                        setSelectedApplication(application)
                        setIsDetailView(true)
                      }}>
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
                          <Button variant="outline" size="sm">
                            View <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {Math.ceil(filteredApplications.length / applicationsPerPage)}
                </span>
                <Button
                  onClick={() => paginate(Math.min(Math.ceil(filteredApplications.length / applicationsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(filteredApplications.length / applicationsPerPage)}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
            {isDetailView && selectedApplication && (
              <div className="w-full lg:w-1/2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{selectedApplication.name}&apos;s Application</CardTitle>
                      <CardDescription>Application for {selectedApplication.role.toLowerCase()} role</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsDetailView(false)} className="lg:hidden">
                      <ChevronLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Email</h4>
                        <p>{selectedApplication.email}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Status</h4>
                        <Badge className={getStatusColor(selectedApplication.status)}>
                          {selectedApplication.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold">Date Applied</h4>
                        <p>{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold">Experience</h4>
                        <p>{selectedApplication.experience}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Motivation</h4>
                        <p>{selectedApplication.motivation}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                      <Button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'APPROVED')}
                        disabled={selectedApplication.status !== 'PENDING'}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'REJECTED')}
                        variant="destructive"
                        disabled={selectedApplication.status !== 'PENDING'}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}