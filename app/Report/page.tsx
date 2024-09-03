"use client"

import React, { useState, FormEvent, ChangeEvent } from 'react';
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
    name: '',
    email: '',
    issue: '',
    rating: '',
    attachment: null,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const handleRatingChange = (value: string) => {
    setFormData(prev => ({ ...prev, rating: value }));
    setErrors(prev => ({ ...prev, rating: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.issue.trim()) newErrors.issue = 'Issue description is required';
    if (!formData.rating) newErrors.rating = 'Please select a rating';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
      // Reset form after successful submission
      setFormData({ name: '', email: '', issue: '', rating: '', attachment: null });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Report an Issue or Provide Feedback</h1>
          <p className="mt-2 text-muted-foreground">
            Please fill out the form below to let us know about any problems you're experiencing or to share your
            feedback.
          </p>
        </div>
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
              {errors.name && <p id="name-error" className="text-sm text-red-500">{errors.name}</p>}
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
              {errors.email && <p id="email-error" className="text-sm text-red-500">{errors.email}</p>}
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
            {errors.issue && <p id="issue-error" className="text-sm text-red-500">{errors.issue}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rating</Label>
            <RadioGroup
              value={formData.rating}
              onValueChange={handleRatingChange}
              aria-invalid={!!errors.rating}
              aria-describedby="rating-error"
            >
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <RadioGroupItem key={value} value={value.toString()} id={`rating-${value}`} />
                ))}
              </div>
            </RadioGroup>
            <span className="text-sm text-muted-foreground">Rate your experience (1-5)</span>
            {errors.rating && <p id="rating-error" className="text-sm text-red-500">{errors.rating}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment</Label>
            <Input
              id="attachment"
              name="attachment"
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </div>
    </div>
  );
}