'use client';

import React, { useState, useEffect } from 'react';
import { CounterClockwiseClockIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { QuestionBankActions } from '@/components/QuestionBankActions';
import { QuestionBankSave } from '@/components/QuestionBankSave';
import { QuestionBankSelector } from '@/components/QuestionBankSelector';

// Define types within the component file
interface CustomQuestionBank {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface Question {
  questionId: string;
  text: string;
  options: string[];
  correctOption: string;
}

export default function Develop() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [questionBanks, setQuestionBanks] = useState<CustomQuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<CustomQuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Fetch question banks from API and set the state
    const fetchQuestionBanks = async () => {
      try {
        const response = await fetch('/api/custom-question-banks/get');
        const data = await response.json();
        setQuestionBanks(data);
      } catch (error) {
        console.error('Error fetching question banks:', error);
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
      console.error('Invalid JSON input:', error);
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
            console.error('Invalid JSON input:', error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveQuestionBank = async (name: string, description: string) => {
    // Logic to save the question bank
    try {
      const response = await fetch('/api/custom-question-banks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, questions }),
      });
      const newBank = await response.json();
      setQuestionBanks([...questionBanks, newBank]);
    } catch (error) {
      console.error('Error saving question bank:', error);
    }
  };

  const handleDeleteQuestionBank = async (bankId: string) => {
    // Logic to delete the question bank
    try {
      await fetch(`/api/custom-question-banks/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bankId }),
      });
      setQuestionBanks(questionBanks.filter((bank) => bank.id !== bankId));
      setSelectedBank(null);
    } catch (error) {
      console.error('Error deleting question bank:', error);
    }
  };

  const handleSelectQuestionBank = (selectedBank: CustomQuestionBank) => {
    // Logic to select the question bank
    setSelectedBank(selectedBank);
    const questionsJson = JSON.stringify(selectedBank.questions, null, 2);
    setJsonInput(questionsJson);
    setQuestions(selectedBank.questions);
  };

  return (
    <>
      <div className="hidden h-full flex-col md:flex">
        <div className="container flex flex-w-full col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Develop</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <QuestionBankSelector questionBanks={questionBanks} onSelect={handleSelectQuestionBank} />
            <QuestionBankSave onSave={handleSaveQuestionBank} />
            <div className="hidden space-x-2 md:flex">
              <Button>Code Viewer</Button>
              <Button>Share</Button>
            </div>
            {selectedBank && (
              <QuestionBankActions bankId={selectedBank.id} onDelete={() => handleDeleteQuestionBank(selectedBank.id)} />
            )}
          </div>
        </div>
        <Separator />

        <div className="container h-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
            <div className="md:order-1">
              <div className="flex flex-col space-y-4">
                <div className="grid h-full gap-6 lg:grid-cols-2">
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-1 flex-col space-y-2">
                      <Label htmlFor="input">Input</Label>
                      <Textarea
                        id="input"
                        placeholder="Paste your JSON input here..."
                        className="flex-1 lg:min-h-[580px]"
                        value={jsonInput}
                        onChange={handleManualJsonInput}
                      />
                    </div>
                    <div className="flex flex-1 flex-col space-y-2">
                      <Label htmlFor="file">Upload a file</Label>
                      <input
                        id="file"
                        type="file"
                        accept="application/json"
                        onChange={handleFileUpload}
                        className="border p-2 rounded"
                      />
                    </div>
                  </div>
                  <div className="mt-[21px] min-h-[400px] rounded-md border bg-muted lg:min-h-[700px] overflow-auto p-4">
                    {/* Render the question bank here */}
                    {questions.length > 0 ? (
                      <div>
                        {questions.map((question) => (
                          <div key={question.questionId} className="p-4 border-b">
                            <p className="font-semibold">{question.text}</p>
                            <ul className="pl-4">
                              {question.options.map((option, index) => (
                                <li key={index} className="list-disc">
                                  {option}
                                </li>
                              ))}
                            </ul>
                            <p className="mt-2">Correct Option: {question.correctOption}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No questions to display</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button>Submit</Button>
                  <Button variant="secondary">
                    <span className="sr-only">Show history</span>
                    <CounterClockwiseClockIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
