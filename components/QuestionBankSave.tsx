import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuestionBankSaveProps {
  onSave: (name: string, description: string) => void;
}

const QuestionBankSave: React.FC<QuestionBankSaveProps> = ({ onSave }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (name && description) {
      onSave(name, description);
      setName("");
      setDescription("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Question Bank Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />
      </div>
      <Button variant="default" onClick={handleSave}>
        Save
      </Button>
    </div>
  );
};

export default QuestionBankSave;
