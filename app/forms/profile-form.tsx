"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." }),
  email: z
    .string({ required_error: "Please select an email to display." })
    .email(),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: "Please enter a valid URL." }),
      })
    )
    .optional(),
  policyAgreement: z.boolean().optional(),
  essentialCookies: z.boolean().default(true), // Always enabled
  analyticsCookies: z.boolean().optional(),
  marketingCookies: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: async () => {
      try {
        const response = await fetch("/api/settings/profile-settings");
        if (!response.ok) throw new Error("Failed to fetch profile settings");

        const data = await response.json();
        setLoading(false);

        return {
          username: data.username || "",
          email: data.email || "",
          bio: data.bio || "",
          urls: data.urls || [{ value: "" }],
          policyAgreement: data.policyAgreement ?? false,
          essentialCookies: true,
          analyticsCookies: data.analyticsCookies ?? false,
          marketingCookies: data.marketingCookies ?? false,
        };
      } catch (error) {
        setLoading(false);
        return {
          username: "",
          email: "",
          bio: "",
          urls: [{ value: "" }],
          policyAgreement: false,
          essentialCookies: true,
          analyticsCookies: false,
          marketingCookies: false,
        };
      }
    },
    mode: "onChange",
  });

  const { fields, append } = useFieldArray({
    name: "urls",
    control: form.control,
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const response = await fetch("/api/settings/profile-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile settings");
      toast({
        title: "Profile settings updated successfully",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile settings",
        description: error.message,
      });
    }
  }

  const handleReset = async () => {
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset user data");
      }

      toast({
        title: "User data reset successfully",
      });

      router.push("/");
    } catch (error: any) {
      toast({
        title: "Failed to reset user data",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Your username" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                You can manage verified email addresses in your{" "}
                <Link href="/forms">email settings</Link>.
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
                You can <span>@mention</span> other users and organizations to link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && "sr-only")}>
                    URLs
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && "sr-only")}>
                    Add links to your website, blog, or social media profiles.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
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
            onClick={() => append({ value: "" })}
          >
            Add URL
          </Button>
        </div>

        <FormField
          control={form.control}
          name="policyAgreement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Agreement</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-2"
                />
              </FormControl>
              <FormDescription>
                Agree to the policies to continue using our platform.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="analyticsCookies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Analytics Cookies</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Enable analytics cookies to help us improve our platform by collecting information on how you use it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketingCookies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marketing Cookies</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Enable marketing cookies to provide you with personalized content and advertising based on your interactions with our platform.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-x-4 mt-6">
          <Button type="submit">Update profile</Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowResetConfirm(true)}
          >
            Reset Account
          </Button>
        </div>
      </form>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-md">
            <h3 className="text-lg font-semibold">
              Are you sure you want to reset your account?
            </h3>
            <p className="text-sm text-gray-600">
              This action will delete all your data and cannot be undone.
            </p>
            <div className="mt-4 flex space-x-4">
              <Button variant="destructive" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}
