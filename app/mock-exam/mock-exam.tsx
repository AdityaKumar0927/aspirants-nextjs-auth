"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

import ExamSetup from "./exam-setup";
import Exam from "./exam";
import AdvancedExamResults from "./exam-results";
import { QuestionType, ExamResultsType, TopicPerformance } from "@/lib/exam-helpers";

const HOUR_IN_SECONDS = 3600;

export default function MockExam() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  // -------------------------------------------------------------
  // 0) State for user selections (exam, year, shift, etc.)
  // -------------------------------------------------------------
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState("");
  const [examTime, setExamTime] = useState<number>(60);
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);
  const [numQuestions, setNumQuestions] = useState<number>(1800);
  const [selectedTopics, setSelectedTopics] = useState<string[] | undefined>(undefined);

  // The fetched questions
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);

  // Tracking answers, statuses
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: string }>({});
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([]);
  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS);
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null);

  // A ref to measure how long user spends on each question
  const questionStartTimeRef = useRef<number>(0);

  // ------------------------------------------------------------------
  // 1) The child calls onStartExam => store picks => fetch questions
  // ------------------------------------------------------------------
  async function handleStartExam(params: {
    exam: string;
    year: number;
    shift?: string;
    examTime?: number;
    skipCompleted?: boolean;
    difficulty?: string;
    numQuestions?: number;
    selectedTopics?: string[];
  }) {
    const {
      exam,
      year,
      shift,
      examTime = 60,
      skipCompleted = false,
      difficulty,
      numQuestions,
      selectedTopics,
    } = params;

    // store them
    setSelectedExam(exam);
    setSelectedYear(year);
    setSelectedShift(shift || "");
    setExamTime(examTime);
    setSkipCompleted(skipCompleted);
    setDifficulty(difficulty);
    setNumQuestions(numQuestions || 1800);
    setSelectedTopics(selectedTopics);

    // start the exam => fetch questions
    await startExam({ exam, year, shift, time: examTime, skipCompleted });
  }

  async function startExam({
    exam,
    year,
    shift,
    time,
    skipCompleted,
  }: {
    exam: string;
    year: number;
    shift?: string;
    time: number;
    skipCompleted?: boolean;
  }) {
    try {
      if (!exam) {
        toast({
          title: "Validation Error",
          description: "Please select an exam before starting.",
          variant: "destructive",
        });
        return;
      }
      if (!year) {
        toast({
          title: "Validation Error",
          description: "Please select a year before starting.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      // build query
      const params = new URLSearchParams();
      params.set("exam", exam);
      params.set("year", String(year));
      params.set("page", "1");
      params.set("pageSize", String(numQuestions || 1800));

      if (shift) {
        // treat shift as "key" or "yearKey" in the DB
        params.set("shift", shift);
      }
      if (skipCompleted) {
        params.set("skipCompleted", "true");
      }
      if (difficulty) {
        params.set("difficulty", difficulty);
      }

      const response = await fetch(`/api/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions for that exam/year/shift.");
      }

      const data = await response.json();
      const matching = data.data ?? data;

      if (!matching || matching.length === 0) {
        toast({
          title: "No Questions Found",
          description: "No matches found for your selection. Please try different options.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setFilteredQuestions(matching);

      // Initialize statuses, answers, timeSpent
      const initialStatuses: { [index: number]: string } = {};
      matching.forEach((_: any, i: number) => {
        initialStatuses[i] = "notVisited";
      });
      setQuestionStatuses(initialStatuses);
      setAnswers(new Array(matching.length).fill(null));
      setTimeSpentPerQuestion(new Array(matching.length).fill(0));

      setExamTimeLeft(time * 60);

      setIsExamStarted(true);
      setIsExamFinished(false);
      setExamResults(null);
      setCurrentQuestion(0);

      questionStartTimeRef.current = Date.now();
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // 2) Handling answers, statuses, navigation
  // ------------------------------------------------------------------
  const handleAnswer = useCallback(
    (answerId: string) => {
      setAnswers((prev) => {
        const newArr = [...prev];
        newArr[currentQuestion] = answerId;
        return newArr;
      });
      setQuestionStatuses((prev) => {
        const oldStatus = prev[currentQuestion];
        return {
          ...prev,
          [currentQuestion]:
            oldStatus === "markedForReview" ? "markedForReview" : "answered",
        };
      });
    },
    [currentQuestion]
  );

  const handleClear = useCallback(() => {
    setAnswers((prev) => {
      const newArr = [...prev];
      newArr[currentQuestion] = null;
      return newArr;
    });
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]:
        prev[currentQuestion] === "markedForReview"
          ? "markedForReview"
          : "notAnswered",
    }));
  }, [currentQuestion]);

  const handleReviewAndNext = useCallback(() => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]: "markedForReview",
    }));
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1);
    }
  }, [currentQuestion, filteredQuestions.length]);

  const handleSaveAndNext = useCallback(() => {
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1);
    }
  }, [currentQuestion, filteredQuestions.length]);

  // Navigation with time tracking
  function updateTimeSpent() {
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    setTimeSpentPerQuestion((prev) => {
      const newTimeSpent = [...prev];
      newTimeSpent[currentQuestion] =
        (newTimeSpent[currentQuestion] || 0) + timeSpent;
      return newTimeSpent;
    });
    questionStartTimeRef.current = Date.now();
  }

  function handleNavigate(index: number) {
    if (index < 0 || index >= filteredQuestions.length) return;
    updateTimeSpent();
    setCurrentQuestion(index);
    setQuestionStatuses((prev) => {
      const st = prev[index];
      if (st === "notVisited") {
        return { ...prev, [index]: "notAnswered" };
      }
      return prev;
    });
  }

  function handleNext() {
    if (currentQuestion < filteredQuestions.length - 1) {
      handleNavigate(currentQuestion + 1);
    }
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      handleNavigate(currentQuestion - 1);
    }
  }

  // ------------------------------------------------------------------
  // 3) Submitting the exam => build examResults
  // ------------------------------------------------------------------
  function handleSubmit() {
    if (!filteredQuestions.length) return;
    updateTimeSpent();

    const totalQuestions = filteredQuestions.length;
    const correctCount = filteredQuestions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correctOption ? 1 : 0);
    }, 0);
    const incorrectAnswers = totalQuestions - correctCount;
    const score = (correctCount / totalQuestions) * 100;

    // For topic performance
    const topicPerformance: Record<string, TopicPerformance> = {};
    const subtopicPerformance: Record<string, TopicPerformance> = {};
    const topicWiseIncorrectAnswers: Record<string, number> = {};

    filteredQuestions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correctOption;
      const top = q.topic || "Unknown Topic";
      if (!topicPerformance[top]) {
        topicPerformance[top] = { correct: 0, total: 0 };
      }
      topicPerformance[top].total++;
      if (isCorrect) {
        topicPerformance[top].correct++;
      } else {
        topicWiseIncorrectAnswers[top] =
          (topicWiseIncorrectAnswers[top] || 0) + 1;
      }

      const sub = q.subtopic || "No Subtopic";
      if (!subtopicPerformance[sub]) {
        subtopicPerformance[sub] = { correct: 0, total: 0 };
      }
      subtopicPerformance[sub].total++;
      if (isCorrect) {
        subtopicPerformance[sub].correct++;
      }
    });

    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3);

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 3);

    const avgTimePerQ =
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) /
      timeSpentPerQuestion.length;

    // Example skill levels
    const skillLevels: Record<string, number> = {
      "Problem Solving": Math.random() * 100,
      "Critical Thinking": Math.random() * 100,
      "Data Analysis": Math.random() * 100,
      "Conceptual Understanding": Math.random() * 100,
      "Application of Knowledge": Math.random() * 100,
    };

    setExamResults({
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswers,
      score,
      topicPerformance,
      subtopicPerformance,
      topStrengths,
      topWeaknesses,
      userAnswers: answers.map((a) => a || ""),
      correctAnswers: filteredQuestions.map((q) => q.correctOption),
      timeSpentPerQuestion,
      averageTimePerQuestion: avgTimePerQ,
      topicWiseIncorrectAnswers,
      questions: filteredQuestions,
      skillLevels,
    });

    setIsExamFinished(true);
  }

  // ------------------------------------------------------------------
  // 4) Timer effect => auto submit
  // ------------------------------------------------------------------
  useEffect(() => {
    let examTimer: NodeJS.Timeout;
    if (isExamStarted && !isExamFinished) {
      examTimer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(examTimer);
            updateTimeSpent();
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (examTimer) clearInterval(examTimer);
    };
  }, [isExamStarted, isExamFinished]);

  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, isExamStarted, isExamFinished]);

  // ------------------------------------------------------------------
  // 5) Early exit
  // ------------------------------------------------------------------
  function exitExam() {
    if (window.confirm("Are you sure you want to exit the exam? Your progress will be lost.")) {
      setIsExamStarted(false);
      setIsExamFinished(false);
      setExamResults(null);
      router.push("/mock-exam");
    }
  }

  function onStartNewExam() {
    setIsExamStarted(false);
    setIsExamFinished(false);
    setExamResults(null);
    // reset the user picks
    setSelectedExam("");
    setSelectedYear(null);
    setSelectedShift("");
    setExamTime(60);
    setSkipCompleted(false);
    setDifficulty(undefined);
    setNumQuestions(1800);
    setSelectedTopics(undefined);
  }

  // ------------------------------------------------------------------
  // 6) Saving to DB => after we have examResults
  // ------------------------------------------------------------------
  async function handleSaveExamResults() {
    if (!examResults) return;

    // Check if user is authenticated
    if (!session || !session.user?.id) {
      toast({
        title: "Not Signed In",
        description: "Please log in to save your exam attempt.",
        variant: "destructive",
      });
      return;
    }

    try {
      // POST to /api/mock-exams
      const body = {
        exam: selectedExam,
        year: selectedYear || undefined,
        shift: selectedShift || undefined,
        completed: true,
        results: examResults,
      };

      const res = await fetch("/api/mock-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to save your exam attempt. Please try again.");
      }

      const data = await res.json();
      toast({
        title: "Exam Saved",
        description: "Your mock exam attempt was saved to your history.",
      });
    } catch (err: any) {
      console.error("Error saving exam:", err);
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  // ------------------------------------------------------------------
  // 7) Loading skeleton if needed
  // ------------------------------------------------------------------
  if (isLoading && !isExamStarted && !isExamFinished) {
    return (
      <div className="min-h-screen p-4 flex flex-col">
        <div className="max-w-3xl mx-auto">
          <Skeleton height={40} count={4} />
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 8) Render the 3 states: Setup -> Exam -> Results
  // ------------------------------------------------------------------
  return (
    <AnimatePresence mode="wait">
      {/* Setup */}
      {!isExamStarted && !isExamFinished && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ExamSetup onStartExam={handleStartExam} />
        </motion.div>
      )}

      {/* Exam in progress */}
      {isExamStarted && !isExamFinished && (
        <motion.div
          key="exam"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50"
        >
          <Exam
            currentQuestion={currentQuestion}
            filteredQuestions={filteredQuestions}
            answers={answers}
            questionStatuses={questionStatuses}
            questionStatusCounts={calcStatusCounts(questionStatuses)}
            examTimeLeft={examTimeLeft}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onClear={handleClear}
            onReviewAndNext={handleReviewAndNext}
            onSaveAndNext={handleSaveAndNext}
            onSubmit={() => {
              if (window.confirm("Are you sure you want to submit the exam?")) {
                handleSubmit();
              }
            }}
            onExit={exitExam}
            onNavigate={handleNavigate}
            userName={session?.user?.name || "Guest"}
            selectedSubject=""
            selectedYear={String(selectedYear || "")}
            selectedLevel=""
          />
        </motion.div>
      )}

      {/* Exam results => show optional save prompt */}
      {isExamFinished && examResults && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AdvancedExamResults
            examResults={examResults}
            onStartNewExam={onStartNewExam}
            onExit={() => setIsExamFinished(false)}
          />

          {/* 
            Prompt the user if they'd like to save the exam attempt.
            Could do a "Confirm" or a small inline button. 
          */}
          <div className="p-4 flex flex-col items-center">
            {session?.user?.id ? (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={() => {
                  if (
                    window.confirm(
                      "Would you like to save your exam attempt to your history?"
                    )
                  ) {
                    handleSaveExamResults();
                  }
                }}
              >
                Save Exam Attempt
              </button>
            ) : (
              <p className="text-sm text-red-500 mt-2">
                Log in to save your exam attempt.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper to count statuses
function calcStatusCounts(obj: { [index: number]: string }) {
  const counts = {
    notVisited: 0,
    notAnswered: 0,
    answered: 0,
    markedForReview: 0,
  };
  for (const status of Object.values(obj)) {
    if (counts[status as keyof typeof counts] !== undefined) {
      counts[status as keyof typeof counts]++;
    }
  }
  return counts;
}
