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

  // ---------------------------
  // 1) User selections
  // ---------------------------
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Instead of "shift", we now use "yearKey"
  const [selectedYearKey, setSelectedYearKey] = useState("");

  // If user picks topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false);
  const [examTime, setExamTime] = useState<number>(60);

  // We'll store how many were fetched for display, if needed
  const [numQuestions, setNumQuestions] = useState<number>(0);

  // ---------------------------
  // 2) Questions from DB
  // ---------------------------
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);

  // ---------------------------
  // 3) Exam states
  // ---------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);

  // Answers & statuses
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [questionStatuses, setQuestionStatuses] = useState<{ [index: number]: string }>({});
  const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState<number[]>([]);
  const [examTimeLeft, setExamTimeLeft] = useState(HOUR_IN_SECONDS);
  const [examResults, setExamResults] = useState<ExamResultsType | null>(null);

  // Track the time user lands on each question
  const questionStartTimeRef = useRef<number>(0);

  // ----------------------------------------------------------------
  // 1) Called by <ExamSetup> => user clicked "Start Exam"
  // ----------------------------------------------------------------
  async function handleStartExam(params: {
    exam: string;
    year: number;
    yearKey?: string;
    examTime?: number;
    skipCompleted?: boolean;
    difficulty?: string;
    selectedTopics?: string[];
  }) {
    const {
      exam,
      year,
      yearKey = "",
      examTime = 60,
      skipCompleted = false,
      difficulty,
      selectedTopics = [],
    } = params;

    // Store user selections
    setSelectedExam(exam);
    setSelectedYear(year);
    setSelectedYearKey(yearKey);
    setExamTime(examTime);
    setSkipCompleted(skipCompleted);
    setDifficulty(difficulty);
    setSelectedTopics(selectedTopics);

    // We'll do a single fetch with a large pageSize (9999) to get all matching questions
    try {
      setIsLoading(true);

      const query = new URLSearchParams();
      query.set("exam", exam);
      query.set("year", String(year));
      query.set("page", "1");
      query.set("pageSize", "9999");

      // If yearKey
      if (yearKey) {
        query.set("yearKey", yearKey);
      }
      // If topics
      if (selectedTopics.length > 0) {
        query.set("topic", selectedTopics.join(","));
      }
      // If skipCompleted
      if (skipCompleted) {
        query.set("skipCompleted", "true");
      }
      // If difficulty
      if (difficulty) {
        query.set("difficulty", difficulty);
      }

      const res = await fetch(`/api/questions?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch questions.");

      const data = await res.json();
      const questions: QuestionType[] = data.data;

      if (!questions || questions.length === 0) {
        toast({
          title: "No Questions Found",
          description: "No matches. Try different filters.",
          variant: "destructive",
        });
        return;
      }

      // The number of fetched questions
      setNumQuestions(questions.length);

      // Start the exam with those questions
      initializeExam(questions, examTime);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function initializeExam(questions: QuestionType[], examTimeInMinutes: number) {
    setFilteredQuestions(questions);

    // statuses = 'notVisited'
    const initStatuses: { [index: number]: string } = {};
    questions.forEach((_, i) => {
      initStatuses[i] = "notVisited";
    });
    setQuestionStatuses(initStatuses);
    setAnswers(new Array(questions.length).fill(null));
    setTimeSpentPerQuestion(new Array(questions.length).fill(0));

    setExamTimeLeft(examTimeInMinutes * 60);

    setIsExamStarted(true);
    setIsExamFinished(false);
    setExamResults(null);
    setCurrentQuestion(0);

    questionStartTimeRef.current = Date.now();
  }

  // ----------------------------------------------------------------
  // 2) Handling answers, statuses, navigation
  // ----------------------------------------------------------------
  const handleAnswer = useCallback(
    (answerId: string) => {
      setAnswers((prev) => {
        const newArr = [...prev];
        newArr[currentQuestion] = answerId;
        return newArr;
      });
      setQuestionStatuses((prev) => {
        const oldStatus = prev[currentQuestion];
        // If it was "markedForReview", keep it. Otherwise "answered"
        return {
          ...prev,
          [currentQuestion]: oldStatus === "markedForReview" ? "markedForReview" : "answered",
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
    setQuestionStatuses((prev) => {
      if (prev[currentQuestion] === "markedForReview") {
        return { ...prev, [currentQuestion]: "markedForReview" };
      }
      return { ...prev, [currentQuestion]: "notAnswered" };
    });
  }, [currentQuestion]);

  const handleReviewAndNext = useCallback(() => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion]: "markedForReview",
    }));
    handleNext();
  }, [currentQuestion]);

  const handleSaveAndNext = useCallback(() => {
    handleNext();
  }, [currentQuestion]);

  function updateTimeSpent() {
    const delta = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    setTimeSpentPerQuestion((prev) => {
      const copy = [...prev];
      copy[currentQuestion] = (copy[currentQuestion] || 0) + delta;
      return copy;
    });
    questionStartTimeRef.current = Date.now();
  }

  function handleNavigate(index: number) {
    if (index < 0 || index >= filteredQuestions.length) return;
    updateTimeSpent();
    setCurrentQuestion(index);

    // If it was "notVisited", change to "notAnswered" upon visiting
    setQuestionStatuses((prev) => {
      if (prev[index] === "notVisited") {
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

  // ----------------------------------------------------------------
  // 3) Submitting => build examResults
  // ----------------------------------------------------------------
  function handleSubmit() {
    if (!filteredQuestions.length) return;
    updateTimeSpent();

    const totalQuestions = filteredQuestions.length;
    const correctCount = filteredQuestions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.correctOption ? 1 : 0);
    }, 0);
    const incorrectAnswers = totalQuestions - correctCount;
    const score = (correctCount / totalQuestions) * 100;

    // topic performance
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

    // sort for top strengths & weaknesses
    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
      .slice(0, 3);

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .slice(0, 3);

    const avgTimePerQ =
      timeSpentPerQuestion.reduce((a, b) => a + b, 0) / timeSpentPerQuestion.length;

    // Example skill levels (mock data)
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

  // ----------------------------------------------------------------
  // 4) Timer => auto submit when time is up
  // ----------------------------------------------------------------
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

  // Each time we move to a new question, reset the time reference
  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, isExamStarted, isExamFinished]);

  // ----------------------------------------------------------------
  // 5) Exiting or Starting a New Exam
  // ----------------------------------------------------------------
  function exitExam() {
    if (window.confirm("Are you sure you want to exit? Progress will be lost.")) {
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

    // reset fields
    setSelectedExam("");
    setSelectedYear(null);
    setSelectedYearKey("");
    setExamTime(60);
    setSkipCompleted(false);
    setDifficulty(undefined);
    setSelectedTopics([]);
    setNumQuestions(0);
  }

  // ----------------------------------------------------------------
  // 7) A bit of skeleton for loading
  // ----------------------------------------------------------------
  if (isLoading && !isExamStarted && !isExamFinished) {
    return (
      <div className="min-h-screen p-4 flex flex-col">
        <div className="max-w-3xl mx-auto">
          <Skeleton height={40} count={4} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // 8) Render Flow: Setup -> Exam -> Results
  // ----------------------------------------------------------------
  return (
    <AnimatePresence mode="wait">
      {/* 8a) Exam setup */}
      {!isExamStarted && !isExamFinished && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ExamSetup
            onStartExam={handleStartExam}
            isLoading={isLoading}
            currentNumQuestions={numQuestions}
          />
        </motion.div>
      )}

      {/* 8b) Exam in progress */}
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
              if (window.confirm("Are you sure you want to submit?")) {
                handleSubmit();
              }
            }}
            onExit={exitExam}
            onNavigate={handleNavigate}
            userName={session?.user?.name || "Guest"}
            selectedSubject={selectedExam}
            selectedYear={String(selectedYear || "")}
            selectedLevel={selectedYearKey}
          />
        </motion.div>
      )}

      {/* 8c) Exam results */}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Count question statuses so we can display them in the UI. */
function calcStatusCounts(obj: { [index: number]: string }) {
  const counts = {
    notVisited: 0,
    notAnswered: 0,
    answered: 0,
    markedForReview: 0,
  };
  for (const st of Object.values(obj)) {
    if (st in counts) {
      counts[st as keyof typeof counts]++;
    }
  }
  return counts;
}
