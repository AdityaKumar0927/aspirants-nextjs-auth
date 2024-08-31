"use client";

import React, { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import MathRenderer from "@/components/layout/MathRenderer";

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  diagramUrl?: string;
}

interface QuestionAdminProps {
  question: QuestionType;
  handleUpdateQuestion: (updatedQuestion: QuestionType) => void;
}

const QuestionAdmin: React.FC<QuestionAdminProps> = ({
  question,
  handleUpdateQuestion,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<QuestionType>(question);

  const handleSaveChanges = () => {
    handleUpdateQuestion(editedQuestion);
    setIsEditing(false);
  };

  return (
    <TooltipProvider>
      <div className="border p-4 mb-4 rounded-md bg-white">
        <div className="flex flex-col space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <p
                className="text-gray-700 cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <MathRenderer text={question.text} />
              </p>
            </TooltipTrigger>
            <TooltipContent>Edit Question Text</TooltipContent>
          </Tooltip>
          <div className="flex flex-wrap items-center space-x-2">
            <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
              {question.subject}
            </span>
            <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
              {question.difficulty}
            </span>
            <span className="bg-emerald-100 text-gray-700 px-2 py-1 rounded-md text-xs">
              {question.year}
            </span>
          </div>
          {question.options?.map((option, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  className={`px-4 py-2 border-gray-300 border rounded-md ${
                    editedQuestion.correctOption === String.fromCharCode(65 + index)
                      ? "bg-blue-100 text-blue-700"
                      : "bg-white text-gray-700"
                  }`}
                  onClick={() => setIsEditing(true)}
                >
                  <MathRenderer text={option} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit Option</TooltipContent>
            </Tooltip>
          ))}
          <div className="flex justify-end space-x-2 mt-2">
            <Checkbox
              checked={isEditing}
              onCheckedChange={() => setIsEditing((prev) => !prev)}
              className="mr-2"
            />
            <Button onClick={handleSaveChanges} className="bg-green-500 text-white">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default QuestionAdmin;
