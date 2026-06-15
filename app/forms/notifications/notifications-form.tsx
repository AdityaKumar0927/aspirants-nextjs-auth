"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import T from "@/components/i18n/T"

const notificationsFormSchema = z.object({
  type: z.enum(["all", "mentions", "none"], {
    error: "You need to select a notification type.",
  }),
  mobile: z.boolean().default(false).optional(),
  communication_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: true,
  security_emails: true,
};

export function NotificationsForm() {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  });

  async function onSubmit(data: NotificationsFormValues) {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Could not save notification settings",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.notificationsNotificationsForm.notifyMeAbout" />
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      <T k="auto.notificationsNotificationsForm.allNewMessages" />
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mentions" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      <T k="auto.notificationsNotificationsForm.directMessagesAndMentions" />
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="none" />
                    </FormControl>
                    <FormLabel className="font-normal"><T k="auto.notificationsNotificationsForm.nothing" /></FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <p className="type-data mb-1 text-[11px] uppercase tracking-[0.14em] text-pencil">
            <T k="auto.notificationsNotificationsForm.emailNotifications" />
          </p>
          <div>
            <FormField
              control={form.control}
              name="communication_emails"
              render={({ field }) => (
                <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <T k="auto.notificationsNotificationsForm.communicationEmails" />
                    </FormLabel>
                    <FormDescription className="text-pencil">
                      <T k="auto.notificationsNotificationsForm.receiveEmailsAboutYourAccount" />
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <T k="auto.notificationsNotificationsForm.marketingEmails" />
                    </FormLabel>
                    <FormDescription className="text-pencil">
                      <T k="auto.notificationsNotificationsForm.receiveEmailsAboutNewProducts" />
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social_emails"
              render={({ field }) => (
                <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base"><T k="auto.notificationsNotificationsForm.socialEmails" /></FormLabel>
                    <FormDescription className="text-pencil">
                      <T k="auto.notificationsNotificationsForm.receiveEmailsForFriendRequests" />
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="security_emails"
              render={({ field }) => (
                <FormItem className="ledger-row min-h-11 flex-row justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base"><T k="auto.notificationsNotificationsForm.securityEmails" /></FormLabel>
                    <FormDescription className="text-pencil">
                      <T k="auto.notificationsNotificationsForm.receiveEmailsAboutYourAccount2" />
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  <T k="auto.notificationsNotificationsForm.useDifferentSettingsForMy" />
                </FormLabel>
                <FormDescription className="text-pencil">
                  <T k="auto.notificationsNotificationsForm.youCanManageYourMobile" />{" "}
                  <Link href="/forms" className="text-ballpoint underline">
                    <T k="auto.notificationsNotificationsForm.mobileSettings" />
                  </Link>{" "}
                  <T k="auto.notificationsNotificationsForm.page" />
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="min-h-11"><T k="auto.notificationsNotificationsForm.saveChanges" /></Button>
      </form>
    </Form>
  );
}
