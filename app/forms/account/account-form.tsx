"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import T from "@/components/i18n/T"

const languages = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh" },
] as const;

const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  language: z.string({
    error: "Please select a language.",
  }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm() {
  const [loading, setLoading] = useState(true);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: async () => {
      const response = await fetch('/api/settings/account-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setLoading(false);
      return {
        name: data.name,
        language: data.language,
      };
    },
  });

  async function onSubmit(data: AccountFormValues) {
    try {
      const response = await fetch('/api/settings/account-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      toast({
        title: "Account updated",
        description: "Your name and language preference have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Could not save account settings",
        description: error.message || "Check your connection and try again.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.accountAccountForm.name" />
              </FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} className="bg-paper" />
              </FormControl>
              <FormDescription className="text-pencil">
                <T k="auto.accountAccountForm.thisIsTheNameThat" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.accountAccountForm.language" />
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "min-h-11 w-[200px] justify-between",
                        !field.value && "text-pencil"
                      )}
                    >
                      {field.value
                        ? languages.find(
                            (language) => language.value === field.value
                          )?.label
                        : "Select language"}
                      <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search languages" />
                    <CommandEmpty><T k="auto.accountAccountForm.noLanguageFoundTryAnother" /></CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              form.setValue("language", language.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                language.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription className="text-pencil">
                <T k="auto.accountAccountForm.thisIsTheLanguageThat" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />
        <Button type="submit" className="min-h-11"><T k="auto.accountAccountForm.saveChanges" /></Button>
      </form>
    </Form>
  );
}
