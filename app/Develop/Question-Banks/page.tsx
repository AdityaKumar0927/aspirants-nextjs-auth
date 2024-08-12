"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { QuestionBankActions } from "@/components/QuestionBankActions";
import QuestionBankSave from "@/components/QuestionBankSave";
import { QuestionBankSelector } from "@/components/QuestionBankSelector";
import { FileUpload } from "@/components/ui/file-upload";
import CustomQuestion from "@/components/shared/CustomQuestion";
import dynamic from "next/dynamic";
import "react-json-view"; // Importing the CSS for the JSON editor

// Dynamically import the React JSON View component
const ReactJsonView = dynamic(() => import("react-json-view"), { ssr: false });

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
  type: "Multiple Choice" | "Numerical";
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
  diagramUrl: string | undefined;
}

const formatQuestions = (questions: any[]) => {
  return questions.map((question) => ({
    questionId: question.questionId,
    text: question.text,
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic,
    difficulty: question.difficulty,
    type: question.type === "Multiple Choice" || question.type === "Numerical" ? question.type : "Multiple Choice",
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
    diagramUrl: question.diagramUrl || undefined,
  }));
};

export default function Develop() {
  const [jsonInput, setJsonInput] = useState<any>({});
  const [questionBanks, setQuestionBanks] = useState<CustomQuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<CustomQuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false); // State to track if a file is uploaded

  useEffect(() => {
    const fetchQuestionBanks = async () => {
      try {
        const response = await fetch("/api/custom-question-banks/get", {
          cache: "no-store", // Ensure it's not statically generated
          credentials: "include",
        });
        const data = await response.json();

        setQuestionBanks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching question banks:", error);
        setQuestionBanks([]);
      }
    };
    fetchQuestionBanks();
  }, []);

  const handleManualJsonInput = (input: any) => {
    setJsonInput(input);
    try {
      const parsedQuestions = input;
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Invalid JSON input:", error);
    }
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const input = event.target.result as string;
          try {
            const parsedQuestions = JSON.parse(input);
            setJsonInput(parsedQuestions);
            setQuestions(parsedQuestions);
            setFileUploaded(true); // Set file uploaded to true after successful file upload
          } catch (error) {
            console.error("Invalid JSON input:", error);
          }
        }
      };
      reader.readAsText(files[0]);
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
        credentials: "include",
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
        credentials: "include",
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
    const questionsJson = selectedBank.customQuestions;
    setJsonInput(questionsJson);
    setQuestions(selectedBank.customQuestions);
    setFileUploaded(true); // Ensure the file uploaded state is true
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="container flex justify-between items-center p-4 md:p-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Develop</h2>
        <div className="ml-auto flex space-x-2">
          <QuestionBankSelector
            questionBanks={questionBanks}
            onSelect={handleSelectQuestionBank}
          />
          <QuestionBankSave onSave={handleSaveQuestionBank} />
          {selectedBank && (
            <QuestionBankActions
              bankId={selectedBank.id}
              onDelete={() => handleDeleteQuestionBank(selectedBank.id)}
            />
          )}
        </div>
      </div>
      <Separator />
      <div className="flex-1 flex flex-col items-center p-4 md:p-6">
        {!fileUploaded && (
          <div className="flex-1 flex items-center justify-center">
            <FileUploadDemo handleFileUpload={handleFileUpload} />
          </div>
        )}
        {fileUploaded && (
          <div className="w-full h-full flex flex-col md:flex-row mt-2">
            <div className="flex flex-col w-full md:w-1/2 p-4">
              <h3 className="text-lg font-semibold">Edit Question Bank</h3>
              <div className="flex-1 overflow-auto">
                <ReactJsonView
                  src={jsonInput}
                  onEdit={(edit) => handleManualJsonInput(edit.updated_src)}
                  onAdd={(add) => handleManualJsonInput(add.updated_src)}
                  onDelete={(del) => handleManualJsonInput(del.updated_src)}
                  enableClipboard={false}
                  theme="monokai"
                  style={{ minHeight: "400px" }}
                />
              </div>
              <div className="mt-4">
                <FileUploadDemo handleFileUpload={handleFileUpload} />
              </div>
            </div>
            <div className="flex flex-col w-full md:w-1/2 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold">Questions</h3>
              <div className="space-y-4">
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <CustomQuestion
                      key={question.questionId}
                      question={question}
                      feedback={""}
                      selectedOption={""}
                      numericalAnswer={""}
                      showMarkscheme={false}
                      handleOptionClick={() => {}}
                      handleNumericalSubmit={() => {}}
                      handleNumericalChange={() => {}}
                      handleMarkschemeToggle={() => {}}
                      handleMarkForReview={() => {}}
                      handleMarkComplete={() => {}}
                      isMarkedForReview={false}
                      isMarkedComplete={false}
                      markschemesDisabled={false}
                      note={""}
                      handleNoteChange={() => {}}
                      userId={""}
                      handleDeleteNote={async () => {}}
                    />
                  ))
                ) : (
                  <p>No questions found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileUploadDemo({ handleFileUpload }: { handleFileUpload: (files: File[]) => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
      <FileUpload onChange={handleFileUpload} />
    </div>
  );
}
