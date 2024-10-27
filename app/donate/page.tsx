"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FormData {
  name: string;
  email: string;
  issue: string;
  rating: string;
  attachment: File | null;
}

export default function IssueReportForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    issue: "",
    rating: "",
    attachment: null,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const handleRatingChange = (value: string) => {
    setFormData((prev) => ({ ...prev, rating: value }));
    setErrors((prev) => ({ ...prev, rating: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.issue.trim()) newErrors.issue = "Issue description is required";
    if (!formData.rating) newErrors.rating = "Please select a rating";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Form submitted:", formData);
      alert("Form submitted successfully!");
      setFormData({ name: "", email: "", issue: "", rating: "", attachment: null });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Tally.so script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    script.onload = () => {
      const iframes = document.querySelectorAll(
        'iframe[data-tally-src]:not([src])'
      );
      iframes.forEach((iframe) => {
        iframe.setAttribute("src", iframe.getAttribute("data-tally-src")!);
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">

      <div className="flex min-h-[100dvh] flex-col bg-background">
<main className="container mx-auto flex-1 px-4 py-12 md:px-6 lg:py-24">
  <div className="mx-auto max-w-3xl space-y-8">
    <div className="space-y-4 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Support Our Cause</h1>
      <p className="text-muted-foreground md:text-xl">
        Your donation will make a real difference in the lives of those we serve. Help us continue our important
        work.
      </p>
    </div>
    <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Donation Options</h2>
          <p className="text-muted-foreground">Choose how you&apos;d like to support our cause.</p>
        </div>
        <RadioGroup defaultValue="one-time" className="grid gap-4">
          <div>
            <RadioGroupItem value="one-time" id="one-time" className="peer sr-only" />
            <Label
              htmlFor="one-time"
              className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary"
            >
              <div>
                <h3 className="text-lg font-medium">One-Time Donation</h3>
                <p className="text-muted-foreground">Make a single donation.</p>
              </div>
              <CheckIcon className="h-6 w-6 text-primary" />
            </Label>
          </div>
          <div>
            <RadioGroupItem value="recurring" id="recurring" className="peer sr-only" />
            <Label
              htmlFor="recurring"
              className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary"
            >
              <div>
                <h3 className="text-lg font-medium">Recurring Donation</h3>
                <p className="text-muted-foreground">Make a monthly donation.</p>
              </div>
              <CheckIcon className="h-6 w-6 text-primary" />
            </Label>
          </div>
        </RadioGroup>
        <div>
          <h2 className="text-2xl font-bold">Donation Amount</h2>
          <p className="text-muted-foreground">Select the amount you&apos;d like to donate.</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            <Button
              variant="outline"
              className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
            >
              $25
            </Button>
            <Button
              variant="outline"
              className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
            >
              $50
            </Button>
            <Button
              variant="outline"
              className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
            >
              $100
            </Button>
            <Button
              variant="outline"
              className="rounded-md border-muted bg-popover px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
            >
              $250
            </Button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Your Information</h2>
          <p className="text-muted-foreground">Please provide your contact details.</p>
          <form className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="First Last" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="123 Main St, Anytown USA" />
            </div>
          </form>
        </div>
        <div className="flex justify-end">
          <Button className="w-full max-w-[200px]">Donate Now</Button>
        </div>
      </div>
    </div>
  </div>
</main>
</div>

<div className="flex flex-col min-h-[100dvh]">
<section className="w-full py-12 md:py-24 lg:py-32 bg-blue-500 border rounded-md">
  <div className="container px-4 md:px-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
      <div className="flex flex-col justify-center space-y-4 text-primary-foreground">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Support Our Cause</h1>
          <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
            Your donation can make a real difference in the lives of those in need. Help us continue our mission
            to provide essential services to the community.
          </p>
        </div>
        <Link
          href="#"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary-foreground px-8 text-sm font-medium text-primary shadow transition-colors hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          prefetch={false}
        >
          Donate Now
        </Link>
      </div>
      <img
        src="/placeholder.svg"
        width="550"
        height="550"
        alt="Donation"
        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
      />
    </div>
  </div>
</section>
<section className="w-full py-12 md:py-24 lg:py-32">
  <div className="container px-4 md:px-6">
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
      <div>
        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Mission</div>
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Helping Those in Need</h2>
        <p className="text-muted-foreground md:text-xl lg:text-base xl:text-xl">
          Your donation will help us provide essential services and resources to families and individuals
          struggling with poverty, homelessness, and other challenges. We are committed to making a lasting impact
          in our community.
        </p>
      </div>
      <div>
        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">How We Use Donations</div>
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Transparent Allocation</h2>
        <p className="text-muted-foreground md:text-xl lg:text-base xl:text-xl">
          We are committed to using your donations responsibly and transparently. 80% of all donations go directly
          to our programs and services, with the remaining 20% used for operational expenses and administrative
          costs.
        </p>
      </div>
    </div>
  </div>
</section>
</div>

    </div>
  );
}

