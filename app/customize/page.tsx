"use client"

import React, { useState, useEffect, useCallback } from "react";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Question from "@/components/shared/Question";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";

interface QuestionType {
  exam: string;
  questionId: string;
  text: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  notes?: string;
  lastAttempted?: string;
  diagramUrl?: string;
}

interface UserAnswer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

interface UserPerformance {
  questionId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  uniqueQuestions: number;
  questionsAttempted: number;
  timeSpent: number;
  accuracy: number;
  weaknessBySubtopic: any;
  improvementOverTime: any;
  attemptRate: number;
  firstAttemptSuccessRate: number;
  reattemptAccuracy: number;
  topicPerformance: any;
  consistency: number;
  engagementLevel: number;
  completed: boolean;
  reviewed: boolean;
}

type FiltersType = {
  exams: string[];
  subjects: string[];
  topics: string[];
  subtopics: string[];
  difficulties: string[];
  types: string[];
  years: string[];
  status: string;
};

const initialFilters: FiltersType = {
  exams: [],
  subjects: [],
  topics: [],
  subtopics: [],
  difficulties: [],
  types: [],
  years: [],
  status: "all",
};

const isStringArray = (value: any): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
};

const fetchData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
  return response.json();
};

const CustomizePage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dropdowns, setDropdowns] = useState({
    exam: false,
    subject: false,
    topic: false,
    subtopic: false,
    difficulty: false,
    year: false,
    type: false,
  });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState<string>("");

  const userId = ""; // Add logic to retrieve user ID if signed in

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        let questionsData = JSON.parse(localStorage.getItem('questionsData') || 'null');
        let userProgressData = JSON.parse(localStorage.getItem('userProgressData') || 'null');
        let userAnswersData = JSON.parse(localStorage.getItem('userAnswersData') || 'null');
        let notesData = JSON.parse(localStorage.getItem('notesData') || 'null');
        let userPerformanceData = JSON.parse(localStorage.getItem('userPerformanceData') || 'null');

        if (!questionsData || !userProgressData || !userAnswersData || !notesData || !userPerformanceData) {
          [questionsData, userProgressData, userAnswersData, notesData, userPerformanceData] = await Promise.all([
            fetchData("/api/questions"),
            fetchData("/api/user-progress"),
            fetchData("/api/user-answers"),
            fetchData("/api/notes"),
            fetchData("/api/user-performance/get")
          ]);
          
          localStorage.setItem('questionsData', JSON.stringify(questionsData));
          localStorage.setItem('userProgressData', JSON.stringify(userProgressData));
          localStorage.setItem('userAnswersData', JSON.stringify(userAnswersData));
          localStorage.setItem('notesData', JSON.stringify(notesData));
          localStorage.setItem('userPerformanceData', JSON.stringify(userPerformanceData));
        }

        const mergedQuestions = questionsData.map((question: QuestionType) => {
          const progress = userProgressData.find((p: any) => p.questionId === question.questionId);
          const userAnswer = userAnswersData.find((a: UserAnswer) => a.questionId === question.questionId);
          const note = notesData.find((n: any) => n.questionId === question.questionId);
          const performance = userPerformanceData.find((p: UserPerformance) => p.questionId === question.questionId);

          if (userAnswer) {
            setSelectedOptions((prev) => ({
              ...prev,
              [question.questionId]: userAnswer.selectedOption,
            }));
            setFeedback((prev) => ({
              ...prev,
              [question.questionId]: userAnswer.isCorrect ? "correct" : "incorrect",
            }));
          }

          return {
            ...question,
            reviewed: progress ? progress.reviewed : false,
            completed: progress ? progress.completed : false,
            notes: note ? note.content : "",
            lastAttempted: progress ? progress.lastAttempted : "",
            performance: performance || {},
          };
        });

        setQuestions(mergedQuestions);
        setFilteredQuestions(mergedQuestions);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  const exams = Array.from(new Set(questions.map((q) => q.exam)));
  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const topics = Array.from(new Set(questions.map((q) => q.topic)));
  const subtopics = Array.from(new Set(questions.map((q) => q.subtopic)));
  const difficulties = Array.from(new Set(questions.map((q) => q.difficulty)));
  const years = Array.from(new Set(questions.map((q) => q.year)));
  const types = Array.from(new Set(questions.map((q) => q.type)));

  const filterQuestions = useCallback(() => {
    let filtered = questions.filter((question) => {
      return (
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year)) &&
        (!filters.types.length || filters.types.includes(question.type)) &&
        (question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
         question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
         question.subtopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
         question.subject.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    if (filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed);
    } else if (filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed);
    }

    setFilteredQuestions(filtered);
  }, [questions, filters, searchQuery]);

  useEffect(() => {
    filterQuestions();
  }, [filters, filterQuestions, searchQuery]);

  const handleFilterChange = (tag: keyof FiltersType, value: string) => {
    setFilters((prevFilters) => {
      const filterValues = prevFilters[tag];
      if (isStringArray(filterValues)) {
        const isSelected = filterValues.includes(value);
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value];
        return { ...prevFilters, [tag]: updatedFilter };
      }
      return prevFilters;
    });
  };

  const updateUserPerformance = async (
    questionId: string,
    updatedFields: Partial<QuestionType & Omit<UserPerformance, "timePerQuestion">>
  ) => {
    try {
      const response = await fetch("/api/user-performance/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, ...updatedFields }),
      });
      if (!response.ok) throw new Error("Failed to update user performance");
    } catch (error) {
      console.error("Error updating user performance:", error);
    }
  };

  const saveUserAnswer = async (questionId: string, selectedOption: string, isCorrect: boolean) => {
    try {
      const response = await fetch("/api/user-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOption, isCorrect }),
      });
      if (!response.ok) throw new Error("Failed to save user answer");
    } catch (error) {
      console.error("Error saving user answer:", error);
    }
  };

  const handleMarkComplete = async (questionId: string, isComplete: boolean) => {
    await updateUserPerformance(questionId, { completed: isComplete });

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, completed: isComplete } : q))
    );
  };

  const handleMarkForReview = async (questionId: string, isReviewed: boolean) => {
    await updateUserPerformance(questionId, { reviewed: isReviewed });

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, reviewed: isReviewed } : q))
    );
  };

  const handleOptionClick = async (questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });

    setSelectedOptions({
      ...selectedOptions,
      [questionId]: option,
    });

    const updatedFields = {
      correctAnswers: isCorrect ? 1 : 0,
      incorrectAnswers: !isCorrect ? 1 : 0,
      uniqueQuestions: 1,
      questionsAttempted: 1,
      lastAttempted: new Date().toISOString(),
      completed: true,
      accuracy: isCorrect ? 100 : 0, // Update as per your logic
      firstAttemptSuccessRate: isCorrect ? 100 : 0, // Update as per your logic
      reattemptAccuracy: isCorrect ? 100 : 0, // Update as per your logic
      // Add other fields as necessary
    };

    await updateUserPerformance(questionId, updatedFields);
    await saveUserAnswer(questionId, option, isCorrect);

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, completed: true } : q))
    );
  };

  const handleNumericalSubmit = async (questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });
    await updateUserPerformance(questionId, { 
      lastAttempted: new Date().toISOString(), 
      completed: true,
      accuracy: isCorrect ? 100 : 0, // Update as per your logic
      firstAttemptSuccessRate: isCorrect ? 100 : 0, // Update as per your logic
      reattemptAccuracy: isCorrect ? 100 : 0, // Update as per your logic
    });
    await saveUserAnswer(questionId, userAnswer, isCorrect);

    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.questionId === questionId ? { ...q, completed: true } : q))
    );
  };

  const handleNoteChange = async (questionId: string, note: string) => {
    setNotes({
      ...notes,
      [questionId]: note,
    });

    try {
      const response = await fetch("/api/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, content: note }),
      });
      if (!response.ok) throw new Error("Failed to save note");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async (questionId: string) => {
    try {
      const response = await fetch("/api/notes/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (!response.ok) throw new Error("Failed to delete note");
    } catch (error) {
      console.error("Error deleting note:", error);
    }

    setNotes((prevNotes) => {
      const updatedNotes = { ...prevNotes };
      delete updatedNotes[questionId];
      return updatedNotes;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (Array.isArray(data)) {
            setQuestions(data);
            setFilteredQuestions(data);
            setError(null);
          } else {
            setError("Invalid JSON format. Expected an array of questions.");
          }
        } catch (err) {
          setError("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleJsonInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(event.target.value);
    try {
      const data = JSON.parse(event.target.value);
      if (Array.isArray(data)) {
        setQuestions(data);
        setFilteredQuestions(data);
        setError(null);
      } else {
        setError("Invalid JSON format. Expected an array of questions.");
      }
    } catch (err) {
      setError("Error parsing JSON.");
    }
  };

  return (
    <>
      <div className="hidden -my-36 flex-col md:flex w-full p-32">
        <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Develop</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end">
            <Button>Save</Button>
            <div className="hidden space-x-2 md:flex">
              <Button>Code Viewer</Button>
            </div>
            <Button>Preset Actions</Button>
          </div>
        </div>
        <Separator />
        <Tabs defaultValue="complete" className="flex-1">
          <div className="container h-full py-6">
            <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
              <div className="hidden flex-col space-y-4 sm:flex md:order-2">
                <div className="grid gap-2">
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mode
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[320px] text-sm" side="left">
                      Choose the interface that best suits your task. You can
                      provide: a simple prompt to complete, starting and ending
                      text to insert a completion within, or some text with
                      instructions to edit it.
                    </HoverCardContent>
                  </HoverCard>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="insert">
                      <span className="sr-only"></span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M14.491 7.769a.888.888 0 0 1 .287.648.888.888 0 0 1-.287.648l-3.916 3.667a1.013 1.013 0 0 1-.692.268c-.26 0-.509-.097-.692-.268L5.275 9.065A.886.886 0 0 1 5 8.42a.889.889 0 0 1 .287-.64c.181-.17.427-.267.683-.269.257-.002.504.09.69.258L8.903 9.87V3.917c0-.243.103-.477.287-.649.183-.171.432-.268.692-.268.26 0 .509.097.692.268a.888.888 0 0 1 .287.649V9.87l2.245-2.102c.183-.172.432-.269.692-.269.26 0 .508.097.692.269Z"
                          fill="currentColor"
                        ></path>
                        <rect
                          x="4"
                          y="15"
                          width="3"
                          height="2"
                          rx="1"
                          fill="currentColor"
                        ></rect>
                        <rect
                          x="8.5"
                          y="15"
                          width="3"
                          height="2"
                          rx="1"
                          fill="currentColor"
                        ></rect>
                        <rect
                          x="13"
                          y="15"
                          width="3"
                          height="2"
                          rx="1"
                          fill="currentColor"
                        ></rect>
                      </svg>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              <div className="md:order-1">
                <TabsContent value="complete" className="mt-0 border-0 p-0">
                  <div className="flex h-full flex-col space-y-4">
                    <Textarea
                      placeholder="Edit JSON or LaTeX"
                      value={jsonInput}
                      onChange={handleJsonInputChange}
                      className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[300px]"
                    />
                    <div className="flex items-center space-x-2">
                      <Button>Submit</Button>
                      <Button variant="secondary">
                        <span className="sr-only">Show history</span>
                        <CounterClockwiseClockIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
              <div className="md:order-2 overflow-y-auto">
                {loading ? (
                  <div className="w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
                    <div className="max-w-6xl w-full">
                      <div className="flex space-x-4 mb-6">
                        <Skeleton height={40} width={120} />
                        <Skeleton height={40} width={120} />
                        <Skeleton height={40} width={120} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                        {["exam", "subject", "topic", "subtopic", "difficulty", "year", "type"].map((filterType) => (
                          <div key={filterType} className="flex items-center space-x-2">
                            <Skeleton height={40} width={120} />
                          </div>
                        ))}
                      </div>
                      <div>
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="mb-4 p-4 border rounded-md">
                            <Skeleton height={20} width={"80%"} />
                            <Skeleton height={20} width={"90%"} />
                            <Skeleton height={20} width={"60%"} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question) => (
                      <Question
                        key={question.questionId}
                        question={question}
                        feedback={feedback[question.questionId]}
                        selectedOption={selectedOptions[question.questionId]}
                        numericalAnswer={numericalAnswers[question.questionId]}
                        showMarkscheme={showMarkscheme[question.questionId]}
                        handleOptionClick={(questionId, option, correctOption) =>
                          handleOptionClick(questionId, option, correctOption)
                        }
                        handleNumericalSubmit={handleNumericalSubmit}
                        handleNumericalChange={(questionId, value) => {
                          setNumericalAnswers({ ...numericalAnswers, [questionId]: value });
                        }}
                        handleMarkschemeToggle={() =>
                          setShowMarkscheme((prev) => ({
                            ...prev,
                            [question.questionId]: !prev[question.questionId],
                          }))
                        }
                        handleMarkForReview={() =>
                          handleMarkForReview(question.questionId, !question.reviewed)
                        }
                        handleMarkComplete={() =>
                          handleMarkComplete(question.questionId, !question.completed)
                        }
                        isMarkedForReview={question.reviewed}
                        isMarkedComplete={question.completed}
                        markschemesDisabled={false}
                        note={notes[question.questionId] || ""}
                        handleNoteChange={handleNoteChange}
                        userId={userId}
                        handleDeleteNote={handleDeleteNote}
                      />
                    ))
                  ) : (
                    <p className="text-red-400">No questions found with the selected filters.</p>
                  )
                )}
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default CustomizePage;
