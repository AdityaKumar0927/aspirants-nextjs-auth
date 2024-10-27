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
