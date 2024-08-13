"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { QuestionBankActions } from "@/components/QuestionBankActions";
import QuestionBankSave from "@/components/QuestionBankSave";
import { QuestionBankSelector } from "@/components/QuestionBankSelector";

interface CustomQuestionBank {
  id: string;
  name: string;
  description: string;
  customQuestions: Question[];
}

interface Question {
  exam: string;
  questionId: string;
  text: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  type: string;
  year: number;
  reviewed: boolean;
  completed: boolean;
  options: string[];
  correctOption: string;
  markscheme: string;
  marks: string | null;
  correctAttempts: string | null;
  wrongAttempts: string | null;
  averageTimeTaken: string | null;
  lastAttempted: Date | null;
  diagramUrl: string | null;
}

const formatQuestions = (questions: any[]) => {
  return questions.map((question) => ({
    questionId: question.questionId,
    text: question.text,
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic,
    difficulty: question.difficulty,
    type: question.type,
    year: parseInt(question.year, 10),
    reviewed: question.reviewed,
    completed: question.completed,
    options: question.options,
    correctOption: question.correctOption,
    markscheme: question.markscheme,
    marks: question.marks || null,
    correctAttempts: question.correctAttempts || null,
    wrongAttempts: question.wrongAttempts || null,
    averageTimeTaken: question.averageTimeTaken || null,
    lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
    diagramUrl: question.diagramUrl || null,
  }));
};

export default function Develop() {
  const [jsonInput, setJsonInput] = useState<string>("");
  const [questionBanks, setQuestionBanks] = useState<CustomQuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<CustomQuestionBank | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Fetch question banks from API and set the state
    const fetchQuestionBanks = async () => {
      try {
        const response = await fetch("/api/custom-question-banks/get", {
          credentials: 'include',
        });
        const data = await response.json();
        setQuestionBanks(data);
      } catch (error) {
        console.error("Error fetching question banks:", error);
      }
    };
    fetchQuestionBanks();
  }, []);

  const handleManualJsonInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setJsonInput(input);
    try {
      const parsedQuestions = JSON.parse(input);
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Invalid JSON input:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const input = event.target.result as string;
          setJsonInput(input);
          try {
            const parsedQuestions = JSON.parse(input);
            setQuestions(parsedQuestions);
          } catch (error) {
            console.error("Invalid JSON input:", error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveQuestionBank = async (name: string, description: string) => {
    try {
      const formattedQuestions = formatQuestions(questions);
      const response = await fetch("/api/custom-question-banks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ name, description, customQuestions: formattedQuestions }),
      });
      const newBank = await response.json();
      setQuestionBanks([...questionBanks, newBank]);
    } catch (error) {
      console.error("Error saving question bank:", error);
    }
  };

  const handleDeleteQuestionBank = async (bankId: string) => {
    try {
      await fetch(`/api/custom-question-banks/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ bankId }),
      });
      setQuestionBanks(questionBanks.filter((bank) => bank.id !== bankId));
      setSelectedBank(null);
    } catch (error) {
      console.error("Error deleting question bank:", error);
    }
  };

  const handleSelectQuestionBank = (selectedBank: CustomQuestionBank) => {
    setSelectedBank(selectedBank);
    const questionsJson = JSON.stringify(selectedBank.customQuestions, null, 2);
    setJsonInput(questionsJson);
    setQuestions(selectedBank.customQuestions);
  };

  return (
    <>
      <div className="hidden h-full flex-col md:flex">
        <div className="container flex flex-w-full col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Develop</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <QuestionBankSelector
              questionBanks={questionBanks}
              onSelect={handleSelectQuestionBank}
            />
            <QuestionBankSave onSave={handleSaveQuestionBank} />
            <div className="hidden space-x-2 md:flex">
              <Button>Code Viewer</Button>
              <Button>Share</Button>
            </div>
            {selectedBank && (
              <QuestionBankActions
                bankId={selectedBank.id}
                onDelete={() => handleDeleteQuestionBank(selectedBank.id)}
              />
            )}
          </div>
        </div>
        <Separator />
        <div className="container grid flex-1 gap-4 md:grid-cols-[1fr_200px]">
          <div className="col-span-3 flex flex-col overflow-hidden">
            <div className="flex-1 space-y-4 p-8 pt-6">
              <div className="flex items-center justify-between space-y-2">
                <h3 className="text-lg font-semibold">Edit Question Bank</h3>
              </div>
              <div>
                <Label htmlFor="question-bank-json" className="sr-only">
                  Question Bank JSON
                </Label>
                <Textarea
                  id="question-bank-json"
                  value={jsonInput}
                  onChange={handleManualJsonInput}
                  rows={20}
                  placeholder="Paste JSON here..."
                />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col overflow-hidden">
            <div className="flex-1 space-y-4 p-8 pt-6">
              <div className="flex items-center justify-between space-y-2">
                <h3 className="text-lg font-semibold">Upload JSON File</h3>
              </div>
              <div>
                <Label htmlFor="file-upload" className="sr-only">
                  Upload JSON File
                </Label>
                <input
                  type="file"
                  id="file-upload"
                  accept=".json"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}