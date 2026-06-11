// components/new-ui/sign-up-form.tsx

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." }),
  email: z
    .string({ error: "Please enter your email." })
    .email(),
  bio: z.string().max(160).min(4),
});

const questionBankSchema = z.object({
  subject: z.string().min(1, { message: "Please select a subject." }),
  difficulty: z.string().min(1, { message: "Please select a difficulty level." }),
  questionsPerDay: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 50, {
      message: "Please enter a number between 1 and 50.",
    }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type QuestionBankValues = z.infer<typeof questionBankSchema>;

export default function SignUpForm() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
  });

  const questionBankForm = useForm<
    z.input<typeof questionBankSchema>,
    any,
    z.output<typeof questionBankSchema>
  >({
    resolver: zodResolver(questionBankSchema),
    defaultValues: {
      subject: "",
      difficulty: "",
    },
  });

  async function onSubmitProfile(data: ProfileFormValues) {
    try {
      // Replace this with your actual API call
      // const response = await fetch("/api/settings/profile-settings", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to update profile settings");
      // }

      toast({
        title: "Profile settings updated successfully",
        description: "Your profile has been saved.",
      });
      setStep(2);
    } catch (error) {
      toast({
        title: "Failed to update profile settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }

  function onSubmitQuestionBank(data: QuestionBankValues) {
    // Replace this with your actual API call
    toast({
      title: "Question bank settings saved",
      description: "Your preferences have been updated.",
    });
    setStep(3);
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {step > 1 && (
        <Button
          variant="ghost"
          className="mb-4 text-gray-600 hover:text-gray-800"
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      )}

      <h1 className="text-2xl font-semibold mb-1">
        {step === 1 && "Let's build your Profile"}
        {step === 2 && "Configure Your Preferences"}
        {step === 3 && "All Set!"}
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        The configurations can be changed anytime in the dashboard.
      </p>

      {step === 1 && (
        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit(onSubmitProfile)}
            className="space-y-6"
          >
            {/* Username Field */}
            <FormField
              control={profileForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Email Field */}
            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Bio Field */}
            <FormField
              control={profileForm.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description for your profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Next
            </Button>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...questionBankForm}>
          <form
            onSubmit={questionBankForm.handleSubmit(onSubmitQuestionBank)}
            className="space-y-6"
          >
            {/* Subject Field */}
            <FormField
              control={questionBankForm.control as any}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Difficulty Field */}
            <FormField
              control={questionBankForm.control as any}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Questions Per Day Field */}
            <FormField
              control={questionBankForm.control as any}
              name="questionsPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Questions Per Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    How many questions would you like to practice daily?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Next
            </Button>
          </form>
        </Form>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <p className="text-gray-700">
            Your account has been set up successfully!
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
