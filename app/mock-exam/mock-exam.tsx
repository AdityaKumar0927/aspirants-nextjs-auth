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

  // Selections
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState("");
  const [examTime, setExamTime] = useState<number>(60);
  const [skipCompleted, setSkipCompleted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);

  // The number of questions is dynamic now.
  const [numQuestions, setNumQuestions] = useState<number>(1800);
  const [selectedTopics, setSelectedTopics] = useState<string[] | undefined>(undefined);

  // Questions
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);

  // UI states
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

  // Track time when user lands on each question
  const questionStartTimeRef = useRef<number>(0);

  // ----------------------------------------------------------------
  // 1) The child calls onStartExam => we handle exam, shift logic, etc.
  // ----------------------------------------------------------------
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

    // Store user selections
    setSelectedExam(exam);
    setSelectedYear(year);
    setSelectedShift(shift || "");
    setExamTime(examTime);
    setSkipCompleted(skipCompleted);
    setDifficulty(difficulty);
    setSelectedTopics(selectedTopics);

    // If a shift is selected, fetch *all* questions for that shift so we know exactly how many exist
    if (shift) {
      try {
        setIsLoading(true);

        const queryShift = new URLSearchParams();
        queryShift.set("exam", exam);
        queryShift.set("year", String(year));
        queryShift.set("shift", shift);
        // We temporarily fetch *all* to see how many questions we have for this shift
        queryShift.set("pageSize", "9999");
        queryShift.set("page", "1");

        // If you'd like to also filter out completed, difficulty, etc., you can add them here:
        if (skipCompleted) queryShift.set("skipCompleted", "true");
        if (difficulty) queryShift.set("difficulty", difficulty);

        const respShift = await fetch(`/api/questions?${queryShift.toString()}`);
        if (!respShift.ok) {
          throw new Error("Failed to fetch shift-based questions.");
        }
        const shiftData = await respShift.json();
        const shiftQuestions = shiftData.data || shiftData;

        if (!Array.isArray(shiftQuestions) || shiftQuestions.length === 0) {
          toast({
            title: "No Questions Found",
            description: `No questions found for exam "${exam}", year ${year}, shift "${shift}".`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Update the number of questions to exactly match the shift’s total
        const shiftQuestionCount = shiftQuestions.length;
        setNumQuestions(shiftQuestionCount);

        // Now that we know how many exist for the shift, start the exam with that exact count
        await startExam({
          exam,
          year,
          shift,
          time: examTime,
          skipCompleted,
          overrideNumQuestions: shiftQuestionCount,
        });
      } catch (e: any) {
        console.error(e);
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // If no shift is selected, we proceed as normal
      await startExam({
        exam,
        year,
        time: examTime,
        skipCompleted,
        difficulty,
        // use the user-specified or fallback to 1800
        overrideNumQuestions: numQuestions || 1800,
      });
    }
  }

  /**
   * Actually fetches the questions and sets up the local exam state.
   */
  async function startExam({
    exam,
    year,
    shift,
    time,
    skipCompleted,
    difficulty,
    overrideNumQuestions,
  }: {
    exam: string;
    year: number;
    shift?: string;
    time: number;
    skipCompleted?: boolean;
    difficulty?: string;
    overrideNumQuestions: number;
  }) {
    try {
      if (!exam) {
        toast({
          title: "Validation Error",
          description: "Please select an exam first.",
          variant: "destructive",
        });
        return;
      }
      if (!year) {
        toast({
          title: "Validation Error",
          description: "Please select a year first.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      const p = new URLSearchParams();
      p.set("exam", exam);
      p.set("year", String(year));
      p.set("page", "1");
      // We use the override to ensure we fetch exactly what we want
      p.set("pageSize", String(overrideNumQuestions));

      if (shift) {
        p.set("shift", shift);
      }
      if (skipCompleted) {
        p.set("skipCompleted", "true");
      }
      if (difficulty) {
        p.set("difficulty", difficulty);
      }

      const r = await fetch(`/api/questions?${p.toString()}`);
      if (!r.ok) throw new Error("Failed to fetch questions.");

      const data = await r.json();
      const matching = data.data ?? data;

      if (!matching || matching.length === 0) {
        toast({
          title: "No Questions Found",
          description: "No matches. Please try different filters.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setFilteredQuestions(matching);

      // init statuses, answers, time
      const initStatuses: { [index: number]: string } = {};
      matching.forEach((_: any, i: number) => {
        initStatuses[i] = "notVisited";
      });
      setQuestionStatuses(initStatuses);
      setAnswers(new Array(matching.length).fill(null));
      setTimeSpentPerQuestion(new Array(matching.length).fill(0));

      setExamTimeLeft(time * 60);

      setIsExamStarted(true);
      setIsExamFinished(false);
      setExamResults(null);
      setCurrentQuestion(0);

      questionStartTimeRef.current = Date.now();
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
        const st = prev[currentQuestion];
        return {
          ...prev,
          [currentQuestion]: st === "markedForReview" ? "markedForReview" : "answered",
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

    // get top strengths & weaknesses
    const topStrengths = Object.entries(topicPerformance)
      .sort((a, b) => b[1].correct/b[1].total - a[1].correct/a[1].total)
      .slice(0, 3);

    const topWeaknesses = Object.entries(topicPerformance)
      .sort((a, b) => a[1].correct/a[1].total - b[1].correct/b[1].total)
      .slice(0, 3);

    const avgTimePerQ = timeSpentPerQuestion.reduce((a, b) => a + b, 0) / timeSpentPerQuestion.length;

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
  // 4) Timer => auto submit when time ends
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

  useEffect(() => {
    if (isExamStarted && !isExamFinished) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, isExamStarted, isExamFinished]);

  // ----------------------------------------------------------------
  // 5) Exiting or starting a new exam
  // ----------------------------------------------------------------
  function exitExam() {
    if (
      window.confirm("Are you sure you want to exit the exam? Progress will be lost.")
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
    // reset
    setSelectedExam("");
    setSelectedYear(null);
    setSelectedShift("");
    setExamTime(60);
    setSkipCompleted(false);
    setDifficulty(undefined);
    setNumQuestions(1800);
    setSelectedTopics(undefined);
  }

  // ----------------------------------------------------------------
  // 6) Possibly saving to DB or local storage ...
  // ----------------------------------------------------------------

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
  // 8) Render: Setup -> Exam -> Results
  // ----------------------------------------------------------------
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

      {/* Exam results */}
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

// Count statuses so we can display them in the UI
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
