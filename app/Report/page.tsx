"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
      {/* Issue Report Form */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Report an Issue or Provide Feedback</h1>
        <p className="mt-2 text-muted-foreground">
          Please fill out the form below to let us know about any problems you&apos;re
          experiencing or to share your feedback.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                aria-invalid={!!errors.name}
                aria-describedby="name-error"
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-500">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                aria-invalid={!!errors.email}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue">Issue or Feedback</Label>
            <Textarea
              id="issue"
              name="issue"
              rows={5}
              value={formData.issue}
              onChange={handleInputChange}
              placeholder="Describe the issue or feedback"
              aria-invalid={!!errors.issue}
              aria-describedby="issue-error"
            />
            {errors.issue && (
              <p id="issue-error" className="text-sm text-red-500">
                {errors.issue}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Rating</Label>
            <RadioGroup value={formData.rating} onValueChange={handleRatingChange}>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <RadioGroupItem key={value} value={value.toString()} />
                ))}
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment</Label>
            <Input
              id="attachment"
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>

      {/* Tally.so Survey */}
      <div className="mt-12">
        <iframe
          data-tally-src="https://tally.so/embed/mZzar0?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
          loading="lazy"
          width="100%"
          height="1752"
          title="We're building a free, JEE and CUET exam prep platform! Fill this form to help us out as well as get early access to our site"
        ></iframe>
      </div>
    </div>
  );
}
