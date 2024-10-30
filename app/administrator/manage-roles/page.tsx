"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

// Updated type definitions
type Role = 'member' | 'volunteer' | 'moderator' | 'administrator';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: {
    name: Role;
  } | null;
}

const validRoles: Role[] = ['member', 'volunteer', 'moderator', 'administrator']

export default function ManageRoles() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<Role | ''>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/user/get')
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized access')
          }
          throw new Error('Failed to fetch users')
        }
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast({
          title: "Error",
          description: (error as Error).message || "Failed to fetch users. Please try again.",
          variant: "destructive",
        })
        if ((error as Error).message === 'Unauthorized access') {
          router.push('/unauthorized')
        }
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchUsers()
    }
  }, [toast, status, router])

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase()
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(lowercasedQuery) || 
      user.email?.toLowerCase().includes(lowercasedQuery)
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and a role.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, roleName: selectedRole }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized access')
        }
        throw new Error('Failed to update user role')
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `User role updated to ${selectedRole} successfully.`,
      })

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser ? { ...user, role: { name: selectedRole } } : user
        )
      )
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update user role: ${(error as Error).message}`,
        variant: "destructive",
      })
      if ((error as Error).message === 'Unauthorized access') {
        router.push('/unauthorized')
      }
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated') {
    return null // The useEffect will handle redirection
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Manage User Roles</CardTitle>
        <CardDescription>Select a user and assign a new role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <Select
            value={selectedUser}
            onValueChange={setSelectedUser}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email}) - Current Role: {user.role?.name || 'No role'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as Role)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {validRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleRoleChange} 
            disabled={loading || !selectedUser || !selectedRole}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Role"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}