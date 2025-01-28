"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// IMPORTANT: Now, the child expects onStartExam(...) to receive ONE object
import ExamSetup from "./exam-setup";
import Exam from "./exam";
import AdvancedExamResults from "./exam-results";

// Single source of truth for types
import {
  QuestionType,
  ExamResultsType,
  TopicPerformance,
} from "@/lib/exam-helpers";

const HOUR_IN_SECONDS = 3600;

export default function MockExam() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  // ------------------------------------------------------------------
  // State for selected exam, year, shift (plus optional fields)
  // We'll fill these once the child calls onStartExam({ ...params })
  // ------------------------------------------------------------------
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState("");
  // Optional fields
  const [examTime, setExamTime] = useState<number>(60);
  // If you want skipCompleted, difficulty, etc. in the parent, store them here as well.

  // Questions once chosen
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);

  // For answering and results
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [questionStatuses, setQuestionStatuses] = useState<{
    [index: number]: string;
  }>({});
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([]);
  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS);
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null);

  const questionStartTimeRef = useRef<number>(0);

  // ------------------------------------------------------------------
  // The child calls this once user picks exam/year (and optional fields)
  // We store them, then fetch questions, set up the exam, etc.
  // ------------------------------------------------------------------
  async function handleStartExam(params: {
    exam: string;
    year: number;
    shift?: string;
    examTime?: number;
    skipCompleted?: boolean;
    difficulty?: string;
    numQuestions?: number;
    // ...any additional optional fields
  }) {
    // Destructure
    const {
      exam,
      year,
      shift,
      examTime = 60,
      skipCompleted,
      difficulty,
      numQuestions,
    } = params;

    // Store them locally if needed
    setSelectedExam(exam);
    setSelectedYear(year);
    setSelectedShift(shift || "");
    setExamTime(examTime);

    // Then start the exam (fetch questions, etc.)
    await startExam({ exam, year, shift, time: examTime });
  }

  // ------------------------------------------------------------------
  // Actually do the question fetch logic
  // ------------------------------------------------------------------
  async function startExam({
    exam,
    year,
    shift,
    time,
  }: {
    exam: string;
    year: number;
    shift?: string;
    time: number;
  }) {
    try {
      // Basic validation
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

      // Build query
      const queryParams = new URLSearchParams({
        exam,
        year: String(year),
      });
      if (shift) {
        queryParams.append("shift", shift);
      }

      const response = await fetch(`/api/questions?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(
          "Failed to fetch questions for the selected exam/year/shift."
        );
      }

      const data = await response.json();
      const matching = data.data ?? data;

      if (!matching || matching.length === 0) {
        toast({
          title: "No Questions Found",
          description:
            "No questions matched your selection. Please try different options.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setFilteredQuestions(matching);

      // Initialize question statuses, answers, time
      const initialStatuses: { [index: number]: string } = {};
      matching.forEach((_: any, i: number) => {
        initialStatuses[i] = "notVisited";
      });
      setQuestionStatuses(initialStatuses);
      setAnswers(new Array(matching.length).fill(null));
      setTimeSpentPerQuestion(new Array(matching.length).fill(0));

      // Convert minutes to seconds
      setExamTimeLeft(time * 60);

      setIsExamStarted(true);
      setIsExamFinished(false);
      setExamResults(null);
      setCurrentQuestion(0);

      questionStartTimeRef.current = Date.now();
    } catch (error) {
      console.error("Error loading exam questions:", error);
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
  // 3) Handling answers, statuses, navigation
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

  // ------------------------------------------------------------------
  // 4) Navigation with time tracking
  // ------------------------------------------------------------------
  function updateTimeSpent() {
    const timeSpent = Math.floor(
      (Date.now() - questionStartTimeRef.current) / 1000
    );
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
  // 5) Submitting the exam
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

    // Example topic performance logic
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

    // Example: random skill levels
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
  // 6) Exam timer effect
  // ------------------------------------------------------------------
  useEffect(() => {
    let examTimer: NodeJS.Timeout;
    if (isExamStarted && !isExamFinished) {
      examTimer = setInterval(() => {
        setExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(examTimer);
            updateTimeSpent();
            handleSubmit(); // automatically submit
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
  // 7) Early exit
  // ------------------------------------------------------------------
  function exitExam() {
    if (
      window.confirm(
        "Are you sure you want to exit the exam? Your progress will be lost."
      )
    ) {
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

    // Optional: reset selections
    setSelectedExam("");
    setSelectedYear(null);
    setSelectedShift("");
    setExamTime(60);
  }

  // ------------------------------------------------------------------
  // 8) Loading skeleton (only for initial load or if you want a spinner)
  // ------------------------------------------------------------------
  if (isLoading && !isExamStarted && !isExamFinished) {
    return (
      <div className="min-h-screen w-full flex flex-col p-4 md:p-8">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton circle width={64} height={64} />
            <Skeleton width={200} height={40} />
          </div>
          <Skeleton width={300} height={40} className="mb-4" />
          <Skeleton height={56} className="mb-4" />
          <Skeleton height={56} className="mb-4" />
          <Skeleton height={56} className="mb-4" />
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton circle width={48} height={48} />
              <Skeleton width={150} height={32} />
            </div>
            <Skeleton count={4} height={24} className="mb-2" />
            <Skeleton width={150} height={48} className="mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 9) Render states (Setup -> Exam -> Results)
  // ------------------------------------------------------------------
  return (
    <AnimatePresence mode="wait">
      {/* 1) exam setup */}
      {!isExamStarted && !isExamFinished && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ExamSetup onStartExam={handleStartExam} />
        </motion.div>
      )}

      {/* 2) exam in progress */}
      {isExamStarted && !isExamFinished && (
        <motion.div
          key="exam"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
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
            userName={session?.user?.name || "Guest User"}
            selectedSubject={""}
            selectedYear={String(selectedYear || "")}
            selectedLevel={""}
          />
        </motion.div>
      )}

      {/* 3) exam results */}
      {isExamFinished && examResults && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AdvancedExamResults
            examResults={examResults}
            onStartNewExam={onStartNewExam}
            onExit={() => setIsExamFinished(false)}
          />
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
