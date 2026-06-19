"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
import T from "@/components/i18n/T"
import { useSiteName } from "@/components/i18n/i18n"

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." }),
  email: z.string().email(),
  // Optional: empty is allowed (mirrors the server schema), so a user with no
  // bio yet can still save other changes — e.g. withdraw a policy.
  bio: z.string().max(160),
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

// Each policy switch maps to a UserPolicyAgreement row (keyed by policyName),
// persisted through the audited /api/policy/accept endpoint which timestamps
// and logs every grant/withdrawal.
const POLICY_FIELDS = [
  { policyName: "terms", field: "termsAccepted" },
  { policyName: "privacy", field: "privacyPolicyAccepted" },
  { policyName: "cookie", field: "cookiePolicyAccepted" },
] as const

// Policies mandatory to use the service — withdrawing one revokes onboarding
// server-side, so the client must re-gate the user (mirrors MANDATORY_POLICIES
// in /api/policy/accept).
const MANDATORY_POLICY_NAMES: string[] = ["terms", "privacy"]

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
  const { update } = useSession()
  const siteName = useSiteName()

  // Last-persisted acceptance state, so a save only writes (and audits) the
  // policies that actually changed.
  const policyBaseline = useRef({
    termsAccepted: initialData.termsAccepted,
    privacyPolicyAccepted: initialData.privacyPolicyAccepted,
    cookiePolicyAccepted: initialData.cookiePolicyAccepted,
  })

  const form = useForm<z.input<typeof profileFormSchema>, any, z.output<typeof profileFormSchema>>({
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

      // Persist policy acceptances through the audited endpoint — only the ones
      // that changed, so we don't write spurious audit rows or re-stamp the
      // acceptedAt timestamp on every save.
      const changedPolicies = POLICY_FIELDS.filter(
        ({ field }) => data[field] !== policyBaseline.current[field]
      )
      let revokedMandatory = false
      let anyPolicyFailed = false
      if (changedPolicies.length > 0) {
        const responses = await Promise.all(
          changedPolicies.map(({ policyName, field }) =>
            fetch("/api/policy/accept", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ policyName, accepted: data[field] }),
            })
          )
        )
        responses.forEach((res, i) => {
          const { policyName, field } = changedPolicies[i]
          if (res.ok) {
            // Advance the baseline per successful write (even if a sibling fails),
            // so a retry only re-sends the policies that didn't persist.
            policyBaseline.current[field] = data[field]
            // A committed withdrawal of a mandatory policy revokes onboarding
            // server-side. Derive this from the request intent (not the response
            // body), so a transport/parse hiccup can't drop the re-gate signal.
            if (!data[field] && MANDATORY_POLICY_NAMES.includes(policyName)) {
              revokedMandatory = true
            }
          } else {
            anyPolicyFailed = true
          }
        })
      }

      if (revokedMandatory) {
        // Re-gate immediately — this takes priority over reporting a sibling
        // failure, since the server has already revoked onboarding. Refresh the
        // JWT so middleware re-fires, then send the user to re-accept.
        await update()
        toast({
          title: "Please re-accept to continue",
          description:
            `Withdrawing the Terms or Privacy Policy means you'll need to review and accept them again to keep using ${siteName}.`,
        })
        router.push("/onboarding")
        return
      }

      if (anyPolicyFailed) {
        throw new Error("Failed to update policy agreements")
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
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-full" />
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
              <FormLabel><T k="auto.formsProfileForm.username" /></FormLabel>
              <FormControl>
                <Input placeholder="Your username" {...field} className="bg-paper" />
              </FormControl>
              <FormDescription className="text-pencil">
                <T k="auto.formsProfileForm.thisIsYourPublicDisplay" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel><T k="auto.formsProfileForm.email" /></FormLabel>
              <FormControl>
                <Input {...field} disabled className="type-data bg-secondary" />
              </FormControl>
              <FormDescription className="text-pencil">
                <T k="auto.formsProfileForm.thisIsYourVerifiedEmail" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel><T k="auto.formsProfileForm.bio" /></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none bg-paper"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-pencil">
                <T k="auto.formsProfileForm.youCan" /> <span className="font-semibold"><T k="auto.formsProfileForm.mention" /></span> <T k="auto.formsProfileForm.otherUsersAndOrganizationsTo" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />

        <div>
          <p className="type-data mb-4 text-[11px] uppercase tracking-[0.14em] text-pencil">
            <T k="auto.formsProfileForm.urls" />
          </p>
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
                        className="type-data bg-paper"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                        className="min-h-11 min-w-11"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only"><T k="auto.formsProfileForm.removeUrl" /></span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-redpen" />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 min-h-11"
            onClick={() => append({ value: "" })}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <T k="auto.formsProfileForm.addUrl" />
          </Button>
        </div>

        <div>
          <p className="type-data mb-1 text-[11px] uppercase tracking-[0.14em] text-pencil">
            <T k="auto.formsProfileForm.policies" />
          </p>
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base"><T k="auto.formsProfileForm.termsAndConditions" /></FormLabel>
                  <FormDescription className="text-pencil">
                    <T k="auto.formsProfileForm.acceptOurTermsAndConditions" />
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
              <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base"><T k="auto.formsProfileForm.privacyPolicy" /></FormLabel>
                  <FormDescription className="text-pencil">
                    <T k="auto.formsProfileForm.acceptOurPrivacyPolicy" />
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
              <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base"><T k="auto.formsProfileForm.cookiePolicy" /></FormLabel>
                  <FormDescription className="text-pencil">
                    <T k="auto.formsProfileForm.acceptOurCookiePolicy" />
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
              <FormLabel><T k="auto.formsProfileForm.fullName" /></FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} className="bg-paper" />
              </FormControl>
              <FormDescription className="text-pencil">
                <T k="auto.formsProfileForm.thisIsYourFullName" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel><T k="auto.formsProfileForm.preferredLanguage" /></FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., English, Spanish, French"
                  {...field}
                  className="bg-paper"
                />
              </FormControl>
              <FormDescription className="text-pencil">
                <T k="auto.formsProfileForm.enterYourPreferredLanguageFor" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />

        <div className="counterfoil flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button type="submit" disabled={submitting} className="min-h-11 w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <T k="auto.formsProfileForm.savingChanges" />
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="min-h-11 w-full sm:w-auto">
                <T k="auto.formsProfileForm.resetAccount" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="paper-sheet">
              <AlertDialogHeader>
                <AlertDialogTitle className="type-display">
                  <T k="auto.formsProfileForm.resetThisAccount" />
                </AlertDialogTitle>
                <AlertDialogDescription className="text-pencil">
                  <T k="auto.formsProfileForm.thisCannotBeUndoneIt" />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-11"><T k="auto.formsProfileForm.keepMyAccount" /></AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={resetting}
                  className="min-h-11 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <T k="auto.formsProfileForm.resettingAccount" />
                    </>
                  ) : (
                    "Reset account"
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

