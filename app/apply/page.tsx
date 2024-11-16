"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    experience: '',
    motivation: '',
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }

      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted.",
      })
      router.push('/application-success')
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">Volunteer/Moderator Application</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select onValueChange={handleRoleChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volunteer">Volunteer</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="experience">Relevant Experience</Label>
          <Textarea
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="motivation">Motivation</Label>
          <Textarea
            id="motivation"
            name="motivation"
            value={formData.motivation}
            onChange={handleChange}
            required
          />
        </div>
        <Button type="submit">Submit Application</Button>
      </form>
    </div>
  )
}