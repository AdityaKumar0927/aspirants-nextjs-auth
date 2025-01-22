"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PlusCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." }),
  email: z.string().email(),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: "Please enter a valid URL." }),
      }),
    )
    .optional(),
  termsAccepted: z.boolean().default(false),
  privacyPolicyAccepted: z.boolean().default(false),
  cookiePolicyAccepted: z.boolean().default(false),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  language: z.string().min(2, { message: "Language must be at least 2 characters." }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialData: ProfileFormValues & { id: string }
  userRole: string
  userId: string
}

export default function ProfileForm({ initialData, userRole, userId }: ProfileFormProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialData,
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    name: "urls",
    control: form.control,
  })

  useEffect(() => {
    setLoading(false)
  }, [])

  async function onSubmit(data: ProfileFormValues) {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/settings/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile settings")
      }

      toast({
        title: "Profile updated",
        description: "Your profile settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile settings",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to reset user data")
      }

      toast({
        title: "Account reset",
        description: "Your account has been successfully reset.",
      })

      // Sign out the user and redirect to home page
      await fetch("/api/auth/signout", { method: "POST" })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset user data",
        variant: "destructive",
      })
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <Skeleton className="h-12 w-1/3 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-12 w-2/3 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-12 w-full bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your username"
                  {...field}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </FormControl>
              <FormDescription className="text-gray-600 dark:text-gray-400">
                This is your public display name. It can be your real name or a pseudonym. You can only change this once
                every 30 days.
              </FormDescription>
              <FormMessage className="text-red-500 dark:text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">Email</FormLabel>
              <FormControl>
                <Input {...field} disabled className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </FormControl>
              <FormDescription className="text-gray-600 dark:text-gray-400">
                This is your verified email address. Contact support if you need to change it.
              </FormDescription>
              <FormMessage className="text-red-500 dark:text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-gray-600 dark:text-gray-400">
                You can <span className="font-semibold">@mention</span> other users and organizations to link to them.
              </FormDescription>
              <FormMessage className="text-red-500 dark:text-red-400" />
            </FormItem>
          )}
        />

        <div>
          <h3 className="mb-4 font-medium text-gray-900 dark:text-gray-100">URLs</h3>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        {...field}
                        placeholder="https://example.com"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove URL</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => append({ value: "" })}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-gray-900 dark:text-gray-100">Terms and Conditions</FormLabel>
                  <FormDescription className="text-gray-600 dark:text-gray-400">
                    Accept our Terms and Conditions.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="privacyPolicyAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-gray-900 dark:text-gray-100">Privacy Policy</FormLabel>
                  <FormDescription className="text-gray-600 dark:text-gray-400">
                    Accept our Privacy Policy.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cookiePolicyAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-gray-900 dark:text-gray-100">Cookie Policy</FormLabel>
                  <FormDescription className="text-gray-600 dark:text-gray-400">
                    Accept our Cookie Policy.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your full name"
                  {...field}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </FormControl>
              <FormDescription className="text-gray-600 dark:text-gray-400">
                This is your full name as it appears on official documents.
              </FormDescription>
              <FormMessage className="text-red-500 dark:text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">Preferred Language</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., English, Spanish, French"
                  {...field}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </FormControl>
              <FormDescription className="text-gray-600 dark:text-gray-400">
                Enter your preferred language for communications and content.
              </FormDescription>
              <FormMessage className="text-red-500 dark:text-red-400" />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between pt-6">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update profile"
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
              >
                Reset Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white dark:bg-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                  This action cannot be undone. This will permanently delete your account and remove your data from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={resetting}
                  className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Form>
  )
}

