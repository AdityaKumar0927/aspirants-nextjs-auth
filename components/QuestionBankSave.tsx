// QuestionBankSave.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuestionBankSaveProps {
  onSave: (name: string, description: string) => Promise<void>;
}

const QuestionBankSave: React.FC<QuestionBankSaveProps> = ({ onSave }) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(name, description);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>
      </div>
      <Button type="submit">Save Question Bank</Button>
    </form>
  );
};

export default QuestionBankSave;
