"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  File,
  Home,
  LineChart,
  FilterIcon,
  MoreHorizontal,
  Package,
  Package2,
  PlusCircle,
  Search,
  Settings,
  Users,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Modal from "@/components/shared/modal";
import MathRenderer from "@/components/layout/MathRenderer";
import { QuestionStatus } from "@prisma/client"; // Import the enum
import { Button } from "@/components/magicui/button";
import { Textarea } from "@headlessui/react"; // Import Textarea component for JSON input

interface Question {
  questionId: string;
  text: string;
  reviewed: boolean;
  subject: string;
  difficulty: string;
  status: QuestionStatus;
  options?: string[];
}

const QuestionBankDashboard: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [updatedText, setUpdatedText] = useState("");
  const [updatedOptions, setUpdatedOptions] = useState<string[]>([]);
  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>(
    QuestionStatus.ACTIVE
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<() => void>(
    () => {}
  );
  const [jsonInput, setJsonInput] = useState<string>(""); // State for JSON input
  const [batchUpload, setBatchUpload] = useState<Question[]>([]); // State for uploaded questions

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/questions");
        const data = await response.json();
        // Sort questions by questionId numerically
        data.sort(
          (a: Question, b: Question) =>
            parseInt(a.questionId, 10) - parseInt(b.questionId, 10)
        );
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  const handleEditClick = (question: Question) => {
    setEditingQuestionId(question.questionId);
    setUpdatedText(question.text);
    setUpdatedOptions(question.options || []);
    setQuestionStatus(question.status);
  };

  const handleSaveChanges = async () => {
    if (!editingQuestionId) return;

    // Map string status to enum value
    const updatedQuestion: Question = {
      questionId: editingQuestionId,
      text: updatedText,
      options: updatedOptions,
      reviewed: true,
      subject: "Subject", // Replace with the correct subject if needed
      difficulty: "Medium", // Adjust based on your data requirements
      status: questionStatus,
    };

    try {
      const response = await fetch(`/api/questions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedQuestion),
      });

      if (!response.ok) throw new Error("Failed to update question");

      setQuestions((prev) =>
        prev.map((q) =>
          q.questionId === editingQuestionId ? updatedQuestion : q
        )
      );
      setEditingQuestionId(null);
      setShowPreview(false);
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setShowPreview(false);
  };

  const handleDelete = (questionId: string) => {
    setConfirmationAction(() => async () => {
      try {
        const response = await fetch(`/api/questions`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questionId }),
        });

        if (!response.ok) throw new Error("Failed to delete question");

        setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
        setShowConfirmationModal(false);
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    });
    setShowConfirmationModal(true);
  };

  const handleAddOption = () => {
    setUpdatedOptions([...updatedOptions, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    setUpdatedOptions((prev) =>
      prev.map((opt, i) => (i === index ? value : opt))
    );
  };

  const handleRemoveOption = (index: number) => {
    setUpdatedOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle JSON input for batch upload
  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setJsonInput(input);
    try {
      const parsedQuestions: Question[] = JSON.parse(input);
      setBatchUpload(parsedQuestions);
    } catch (error) {
      console.error("Invalid JSON input:", error);
    }
  };

const handleBatchUpload = async () => {
  try {
    const response = await fetch('/api/questions/batch-upload', {
      method: 'POST', // Ensure this matches the backend route
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchUpload), // Ensure data is properly formatted
    });

    if (!response.ok) throw new Error('Failed to upload batch of questions');

    const newQuestions = await response.json();
    setQuestions((prev) => [...prev, ...newQuestions]);
    setJsonInput('');
    setBatchUpload([]);
  } catch (error) {
    console.error('Error uploading batch:', error);
  }
};


  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="#"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">Acme Inc</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Home className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Package className="h-5 w-5" />
                    Questions
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    Users
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <LineChart className="h-5 w-5" />
                    Analytics
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <Image
                    src="/placeholder-user.jpg"
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="overflow-hidden rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="all">
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="archived" className="hidden sm:flex">
                    Archived
                  </TabsTrigger>
                  <TabsTrigger value="batch-upload">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Batch Upload
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <FilterIcon className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                          Filter
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Active</DropdownMenuItem>
                      <DropdownMenuItem>Draft</DropdownMenuItem>
                      <DropdownMenuItem>Archived</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Export
                    </span>
                  </Button>
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Question
                    </span>
                  </Button>
                </div>
              </div>
              <TabsContent value="all">
                {/* Existing Question Management UI */}
                <Card x-chunk="dashboard-06-chunk-0">
                  <CardHeader>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      Manage your questions and track their performance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Question</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Subject
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Difficulty
                          </TableHead>
                          <TableHead>
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((question, index) =>
                          editingQuestionId === question.questionId ? (
                            <TableRow key={question.questionId}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">
                                <textarea
                                  className="w-full p-2 border rounded"
                                  value={updatedText}
                                  onChange={(e) =>
                                    setUpdatedText(e.target.value)
                                  }
                                  rows={4}
                                />
                                <div className="mt-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Options (LaTeX Supported)
                                  </label>
                                  {updatedOptions.map((option, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center mb-2"
                                    >
                                      <input
                                        type="text"
                                        className="w-full p-2 border rounded mr-2"
                                        value={option}
                                        onChange={(e) =>
                                          handleOptionChange(
                                            index,
                                            e.target.value
                                          )
                                        }
                                      />
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                          handleRemoveOption(index)
                                        }
                                      >
                                        ✕
                                      </Button>
                                    </div>
                                  ))}
                                  <Button size="sm" onClick={handleAddOption}>
                                    Add Option
                                  </Button>
                                </div>
                                {showPreview && (
                                  <div className="mt-4 border p-4 bg-gray-50 rounded-md">
                                    <MathRenderer text={updatedText} />
                                    <div className="mt-2">
                                      <strong>Options:</strong>
                                      {updatedOptions.map((option, index) => (
                                        <p key={index}>
                                          <MathRenderer text={option} />
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <select
                                  className="w-full p-2 border rounded"
                                  value={questionStatus}
                                  onChange={(e) =>
                                    setQuestionStatus(
                                      e.target.value as QuestionStatus
                                    )
                                  }
                                >
                                  <option value={QuestionStatus.ACTIVE}>
                                    Active
                                  </option>
                                  <option value={QuestionStatus.DRAFT}>
                                    Draft
                                  </option>
                                  <option value={QuestionStatus.ARCHIVED}>
                                    Archived
                                  </option>
                                </select>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {question.subject}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {question.difficulty}
                              </TableCell>
                              <TableCell className="flex flex-col gap-2">
                                <Button size="sm" onClick={handleSaveChanges}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setShowPreview((prev) => !prev)
                                  }
                                >
                                  {showPreview ? "Hide Preview" : "Preview"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow key={question.questionId}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">
                                <MathRenderer text={question.text} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{question.status}</Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {question.subject}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {question.difficulty}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      aria-haspopup="true"
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Toggle menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => handleEditClick(question)}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(question.questionId)}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <div className="text-xs text-muted-foreground">
                      Showing <strong>1-10</strong> of{" "}
                      <strong>{questions.length}</strong> questions
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="batch-upload">
                {/* Batch Upload UI */}
                <Card>
                  <CardHeader>
                    <CardTitle>Batch Upload Questions</CardTitle>
                    <CardDescription>
                      Upload a batch of questions in JSON format.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={jsonInput}
                      onChange={handleJsonInputChange}
                      rows={10}
                      placeholder="Paste JSON of questions here..."
                      className="w-full p-2 border rounded"
                    />
                  </CardContent>
                  <CardFooter>
                  <Button
                  variant="default" // Change "primary" to "default" or another valid variant
                  onClick={handleBatchUpload}
                  disabled={!batchUpload.length}
                  >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Batch
                  </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <Modal
            showModal={showConfirmationModal}
            setShowModal={setShowConfirmationModal}
          >
            <div className="text-center">
              <p>Are you sure you want to proceed with this action?</p>
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmationAction}>Confirm</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </TooltipProvider>
  );
};

export default QuestionBankDashboard;
