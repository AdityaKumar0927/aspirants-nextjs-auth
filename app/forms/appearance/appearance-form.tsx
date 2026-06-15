"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import T from "@/components/i18n/T"

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark"], {
    error: "Please select a theme.",
  }),
  font: z.enum(["inter", "manrope", "system"], {
    error: "Please select a font.",
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

// This can come from your database or API.
const defaultValues: Partial<AppearanceFormValues> = {
  theme: "light",
}

export function AppearanceForm() {
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  })

  function onSubmit(data: AppearanceFormValues) {
    toast({
      title: "Appearance updated",
      description: "Your theme and font preferences have been saved.",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="font"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.appearanceAppearanceForm.font" />
              </FormLabel>
              <div className="relative w-max">
                <FormControl>
                  <select
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "min-h-11 w-[200px] appearance-none font-normal"
                    )}
                    {...field}
                  >
                    <option value="inter"><T k="auto.appearanceAppearanceForm.inter" /></option>
                    <option value="manrope"><T k="auto.appearanceAppearanceForm.manrope" /></option>
                    <option value="system"><T k="auto.appearanceAppearanceForm.system" /></option>
                  </select>
                </FormControl>
                <ChevronDownIcon className="absolute right-3 top-3.5 h-4 w-4 text-pencil" />
              </div>
              <FormDescription className="text-pencil">
                <T k="auto.appearanceAppearanceForm.setTheFontYouWant" />
              </FormDescription>
              <FormMessage className="text-redpen" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                <T k="auto.appearanceAppearanceForm.theme" />
              </FormLabel>
              <FormDescription className="text-pencil">
                <T k="auto.appearanceAppearanceForm.selectTheThemeForThe" />
              </FormDescription>
              <FormMessage className="text-redpen" />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid max-w-md grid-cols-2 gap-4 pt-2 sm:gap-8"
              >
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="light" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-rule p-1 hover:border-pencil">
                      <div className="space-y-2 rounded-sm bg-[#f1f2ec] p-2">
                        <div className="space-y-2 rounded-md bg-[#fbfbf8] p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#e3e5dc]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#e3e5dc]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[#fbfbf8] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#e3e5dc]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#e3e5dc]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[#fbfbf8] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#e3e5dc]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#e3e5dc]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      <T k="auto.appearanceAppearanceForm.light" />
                    </span>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="dark" className="sr-only" />
                    </FormControl>
                    <div className="items-center rounded-md border-2 border-rule p-1 hover:border-pencil">
                      <div className="space-y-2 rounded-sm bg-[#0b0f20] p-2">
                        <div className="space-y-2 rounded-md bg-[#11162b] p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#9aa1b9]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#9aa1b9]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[#11162b] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#9aa1b9]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#9aa1b9]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[#11162b] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#9aa1b9]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#9aa1b9]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      <T k="auto.appearanceAppearanceForm.dark" />
                    </span>
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <Button type="submit" className="min-h-11"><T k="auto.appearanceAppearanceForm.savePreferences" /></Button>
      </form>
    </Form>
  )
}