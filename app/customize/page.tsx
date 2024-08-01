"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const customizeSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  subtitle: z.string().optional(),
  questions: z.string().min(1, { message: "Questions JSON is required" }),
});

type CustomizeFormValues = z.infer<typeof customizeSchema>;

export default function CustomizePage() {
  const [questions, setQuestions] = useState([]);
  const form = useForm<CustomizeFormValues>({
    resolver: zodResolver(customizeSchema),
  });

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const json = e.target.result as string;
          form.setValue("questions", json);
          setQuestions(JSON.parse(json));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (data: CustomizeFormValues) => {
    try {
      const response = await fetch('/api/custom-question-banks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create custom question bank');
      toast({ title: 'Custom question bank created successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to create custom question bank', description: error.message });
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <label>Title</label>
          <Input {...form.register("title")} />
        </div>
        <div>
          <label>Subtitle</label>
          <Input {...form.register("subtitle")} />
        </div>
        <div>
          <label>Upload JSON</label>
          <input type="file" accept=".json" onChange={handleUpload} />
        </div>
        <div>
          <label>Questions JSON</label>
          <Textarea {...form.register("questions")} />
        </div>
        <Button type="submit">Save Question Bank</Button>
      </form>

      <div>
        <h2>Preview Questions</h2>
        <pre>{JSON.stringify(questions, null, 2)}</pre>
      </div>
    </div>
  );
}
