"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
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
  CheckCircle,
  XCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Modal from "@/components/shared/modal";
import MathRenderer from "@/components/layout/MathRenderer";
import { QuestionStatus } from "@prisma/client";
import { Button } from "@/components/magicui/button";
import { Textarea } from "@headlessui/react";

interface Question {
  questionId: string;
  text: string;
  reviewed: boolean;
  subject: string;
  difficulty: string;
  status: QuestionStatus;
  options?: string[];
}

// Notification Component with animation and auto-dismiss
const Notification = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-3 rounded-md shadow-md transition-transform transform ${
        type === "success"
          ? "bg-white text-green-700 scale-105"
          : "bg-white text-red-700 scale-105"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="text-green-500" />
      ) : (
        <XCircle className="text-red-500" />
      )}
      <span className="ml-2">{message}</span>
    </div>
  );
};

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
  const [jsonInput, setJsonInput] = useState<string>("");
  const [batchUpload, setBatchUpload] = useState<Question[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/questions");
        const data = await response.json();
        data.sort(
          (a: Question, b: Question) =>
            parseInt(a.questionId, 10) - parseInt(b.questionId, 10)
        );
        setQuestions(data);
      } catch (error) {
        setNotification({
          message: "Error fetching questions",
          type: "error",
        });
      } finally {
        setIsLoading(false);
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

    setIsLoading(true);
    const updatedQuestion: Question = {
      questionId: editingQuestionId,
      text: updatedText,
      options: updatedOptions,
      reviewed: true,
      subject: "Subject", // Replace with the correct subject if needed
      difficulty: "Medium",
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
      setNotification({
        message: "Question updated successfully",
        type: "success",
      });
    } catch (error) {
      setNotification({ message: "Error updating question", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setShowPreview(false);
  };

  const handleDelete = (questionId: string) => {
    setConfirmationAction(() => async () => {
      setIsLoading(true);
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
        setNotification({
          message: "Question deleted successfully",
          type: "success",
        });
      } catch (error) {
        setNotification({ message: "Error deleting question", type: "error" });
      } finally {
        setIsLoading(false);
      }
    });
    setShowConfirmationModal(true);
  };

  const handleBulkDelete = () => {
    setConfirmationAction(() => async () => {
      setIsLoading(true);
      try {
        await Promise.all(
          selectedQuestions.map(async (questionId) => {
            const response = await fetch(`/api/questions`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ questionId }),
            });

            if (!response.ok)
              throw new Error(`Failed to delete question ${questionId}`);
          })
        );

        setQuestions((prev) =>
          prev.filter((q) => !selectedQuestions.includes(q.questionId))
        );
        setSelectedQuestions([]);
        setShowConfirmationModal(false);
        setNotification({
          message: "Selected questions deleted successfully",
          type: "success",
        });
      } catch (error) {
        setNotification({
          message: "Error deleting selected questions",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    });
    setShowConfirmationModal(true);
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
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

  const handleJsonInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const input = e.target.value;
    setJsonInput(input);
    try {
      const parsedQuestions: Question[] = JSON.parse(input);
      setBatchUpload(parsedQuestions);
    } catch (error) {
      setNotification({ message: "Invalid JSON input", type: "error" });
    }
  };

  const handleBatchUpload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/questions/batch-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchUpload),
      });

      if (!response.ok) throw new Error("Failed to upload batch of questions");

      const newQuestions = await response.json();
      setQuestions((prev) => [...prev, ...newQuestions]);
      setJsonInput("");
      setBatchUpload([]);
      setNotification({ message: "Batch upload successful", type: "success" });
    } catch (error) {
      setNotification({ message: "Error uploading batch", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
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
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      Manage your questions and track their performance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton height={40} count={5} />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <input
                                type="checkbox"
                                onChange={(e) =>
                                  setSelectedQuestions(
                                    e.target.checked
                                      ? questions.map((q) => q.questionId)
                                      : []
                                  )
                                }
                              />
                            </TableHead>
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
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuestions.includes(
                                      question.questionId
                                    )}
                                    onChange={() =>
                                      handleSelectQuestion(question.questionId)
                                    }
                                  />
                                </TableCell>
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
                                    <Button
                                      size="sm"
                                      onClick={handleAddOption}
                                    >
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
                                  <Button
                                    size="sm"
                                    onClick={handleSaveChanges}
                                  >
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
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuestions.includes(
                                      question.questionId
                                    )}
                                    onChange={() =>
                                      handleSelectQuestion(question.questionId)
                                    }
                                  />
                                </TableCell>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">
                                  <MathRenderer text={question.text} />
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {question.status}
                                  </Badge>
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
                                        <span className="sr-only">
                                          Toggle menu
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleEditClick(question)
                                        }
                                      >
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDelete(question.questionId)
                                        }
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
                    )}
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
                      variant="default"
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

        {showConfirmationModal && (
          <Modal
            showModal={showConfirmationModal}
            setShowModal={setShowConfirmationModal}
          >
            <div className="text-center backdrop-blur-md p-8 rounded-xl">
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
