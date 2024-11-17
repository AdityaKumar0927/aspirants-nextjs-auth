'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const profileFormSchema = z.object({
  username: z.string().min(2).max(30),
  email: z.string().email(),
  bio: z.string().max(160).min(4),
  urls: z.array(z.object({ value: z.string().url() })).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const router = useRouter()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
      urls: [],
    },
  })

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${userId}`)
        if (!response.ok) throw new Error('Failed to fetch profile')
        const data = await response.json()
        form.reset(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        })
      }
    }

    fetchProfile()
  }, [userId, form])

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
              <FormDescription>This is your public display name.</FormDescription>
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
              <FormDescription>This is your contact email.</FormDescription>
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
                <Input {...field} />
              </FormControl>
              <FormDescription>Tell us about yourself in a few words.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`urls.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL {index + 1}</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button type="button" variant="outline" onClick={() => append({ value: '' })}>
          Add URL
        </Button>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
        <Button type="button" variant="destructive" onClick={() => setShowResetConfirm(true)}>
          Reset Profile
        </Button>
      </form>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reset your profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All of your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset Profile</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}