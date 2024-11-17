'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const profileFormSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }).max(30, { message: "Username must not be longer than 30 characters." }),
  email: z.string({ required_error: "Please select an email to display." }).email(),
  bio: z.string().max(160).min(4),
  urls: z.array(z.object({ value: z.string().url({ message: "Please enter a valid URL." }) })).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  userId: string
  initialData: ProfileFormValues
  userRole: string
}

export default function ProfileForm({ userId, initialData, userRole }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const router = useRouter()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialData,
  })

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to reset profile')

      toast({
        title: 'Success',
        description: 'Profile reset successfully',
      })
      router.push('/')
    } catch (error) {
      console.error('Error resetting profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset profile',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormDescription>
                You can manage verified email addresses in your email settings.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can @mention other users and organizations to link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>URLs</FormLabel>
          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ value: '' })}
          >
            Add URL
          </Button>
        </div>

        <FormItem>
          <FormLabel>Role</FormLabel>
          <FormControl>
            <Input readOnly value={userRole} />
          </FormControl>
          <FormDescription>
            Your current role in the system. This cannot be changed here.
          </FormDescription>
        </FormItem>

        <div className="space-x-4 mt-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update profile'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowResetConfirm(true)}
          >
            Reset Account
          </Button>
        </div>
      </form>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reset your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete all your data and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}