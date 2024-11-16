'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from 'next-auth'
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
import { Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Form from 'next/form'

interface ApplicationFormProps {
  session: Session
}

export default function ApplicationForm({ session }: ApplicationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setFormErrors({})

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      toast({
        title: "Success",
        description: "Your application has been submitted successfully.",
      })
      router.push('/application-success')
    } catch (error) {
      console.error('Application submission error:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
      if (error instanceof Error) {
        setFormErrors({ submit: error.message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session.user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>User data is missing. Please try signing in again.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Volunteer/Moderator Application</CardTitle>
        <CardDescription>Join our team and help make a difference!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={session.user.name || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              defaultValue={session.user.email || ''}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Relevant Experience</Label>
            <Textarea
              id="experience"
              name="experience"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivation">Motivation</Label>
            <Textarea
              id="motivation"
              name="motivation"
              required
            />
          </div>
          {formErrors.submit && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formErrors.submit}</AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit"
            disabled={isSubmitting} 
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </Form>
      </CardContent>
    </Card>
  )
}