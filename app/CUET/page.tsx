"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "katex/dist/katex.min.css";
import Question from "@/components/shared/Question";
import Modal from "@/components/shared/modal";
import MathRenderer from "@/components/layout/MathRenderer";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: "Multiple Choice" | "Numerical";
  year: string;
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
  notes?: string;
}

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);
  const [filters, setFilters] = useState({
    subject: "",
    difficulty: "",
    type: "",
    year: "",
    status: "all",
  });
  const [dropdowns, setDropdowns] = useState({
    subject: false,
    difficulty: false,
    year: false,
    type: false,
  });
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [numericalAnswers, setNumericalAnswers] = useState<Record<string, string>>({});
  const [showMarkscheme, setShowMarkscheme] = useState<Record<string, boolean>>({});
  const [markschemeContent, setMarkschemeContent] = useState<string>("");
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const dropdownTimeout = useRef<Record<string, NodeJS.Timeout>>({});

  const userId = "sample-user-id"; // Replace with actual user ID retrieval logic

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const [questionsResponse, progressResponse] = await Promise.all([
          fetch("/api/questions"),
          fetch("/api/user-progress"),
        ]);
  
        if (!questionsResponse.ok || !progressResponse.ok) throw new Error("Failed to fetch data");
  
        const questions = await questionsResponse.json();
        const userProgress = await progressResponse.json();
  
        // Define types for question and progress
        interface Question {
          questionId: string;
          // Add other properties as needed
        }
  
        interface Progress {
          questionId: string;
          // Add other properties as needed
        }
  
        // Merge progress with questions
        const mergedQuestions = questions.map((question: Question) => {
          const progress = userProgress.find((p: Progress) => p.questionId === question.questionId);
          return { ...question, ...progress };
        });
  
        setQuestions(mergedQuestions);
        setFilteredQuestions(mergedQuestions);
      } catch (error) {
        console.error(error);
      }
    };
  
    fetchQuestions();
  }, []);
  

  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const difficulties = Array.from(new Set(questions.map((q) => q.difficulty)));
  const years = Array.from(new Set(questions.map((q) => q.year)));
  const types = Array.from(new Set(questions.map((q) => q.type)));

  const filterQuestions = useCallback(() => {
    let filtered = questions.filter((question) => {
      return (
        (!filters.subject || question.subject === filters.subject) &&
        (!filters.difficulty || question.difficulty === filters.difficulty) &&
        (!filters.year || question.year === filters.year) &&
        (!filters.type || question.type === filters.type)
      );
    });

    if (filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed);
    } else if (filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed);
    }

    setFilteredQuestions(filtered);
  }, [questions, filters]);

  useEffect(() => {
    filterQuestions();
  }, [filterQuestions]);

  const handleFilterChange = (tag: string, value: string) => {
    setFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
  };

  const handleMarkschemeToggle = (questionId: string, markscheme: string) => {
    setMarkschemeContent(markscheme);
  };

  const handleMarkForReview = async (questionId: string) => {
    try {
      const response = await fetch("/api/markForReview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reviewed: true }),
      });
      if (!response.ok) throw new Error("Failed to mark for review");
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleMarkComplete = async (questionId: string) => {
    try {
      const response = await fetch("/api/markComplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, completed: true }),
      });
      if (!response.ok) throw new Error("Failed to mark complete");
    } catch (error) {
      console.error(error);
    }
  };
  

  const handleNoteChange = (questionId: string, note: string) => {
    setNotes({
      ...notes,
      [questionId]: note,
    });
  };

  return (
    <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
      <div className="max-w-6xl w-full">
        <h1 className="mb-2 text-left font-display text-4xl font-bold tracking-[-0.02em] drop-shadow-sm sm:text-5xl sm:leading-[5rem]">
          CUET Question Bank
        </h1>
        <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200 uppercase last:mr-0 mr-1">
          AI Generated Solutions
        </span>
        <div className="flex space-x-4 mb-6"></div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
          {["subject", "difficulty", "year", "type"].map((filterType) => (
            <Popover
              key={filterType}
              content={
                <div className="w-full bg-white rounded-md p-2 sm:w-40">
                  {(filterType === "subject"
                    ? subjects
                    : filterType === "difficulty"
                    ? difficulties
                    : filterType === "year"
                    ? years
                    : types
                  ).map((value: string) => (
                    <button
                      key={value}
                      onClick={() => {
                        handleFilterChange(filterType, value);
                        setDropdowns({ ...dropdowns, [filterType]: false });
                      }}
                      className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              }
              align="start"
              openPopover={dropdowns[filterType as keyof typeof dropdowns]}
              setOpenPopover={(open) => {
                setDropdowns((prev) => ({
                  ...prev,
                  [filterType]: open,
                }));
              }}
            >
              <button
                onClick={() =>
                  setDropdowns((prev) => ({
                    ...prev,
                    [filterType]: !prev[filterType as keyof typeof dropdowns],
                  }))
                }
                className="flex w-full sm:w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 bg-white transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
              >
                <p className="text-gray-600">
                  {filters[filterType as keyof typeof filters] ||
                    filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </p>
                <ChevronDown
                  className={`h-4 w-4 text-gray-600 transition-all ${
                    dropdowns[filterType as keyof typeof dropdowns]
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>
            </Popover>
          ))}
          {["all", "complete", "review"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`px-4 py-2 rounded-md ${
                filters.status === status ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <Question
              key={question.questionId}
              question={question}
              feedback={feedback[question.questionId]}
              numericalAnswer={numericalAnswers[question.questionId]}
              showMarkscheme={showMarkscheme[question.questionId]}
              handleOptionClick={() => {}}
              handleNumericalSubmit={() => {}}
              handleNumericalChange={() => {}}
              handleMarkschemeToggle={() =>
                handleMarkschemeToggle(
                  question.questionId,
                  question.markscheme || "No markscheme available"
                )
              }
              handleMarkForReview={() => handleMarkForReview(question.questionId)}
              handleMarkComplete={() => handleMarkComplete(question.questionId)}
              isMarkedForReview={question.reviewed}
              isMarkedComplete={question.completed}
              markschemesDisabled={false}
              note={notes[question.questionId] || ""}
              handleNoteChange={handleNoteChange}
              userId={userId}
            />
          ))
        ) : (
          <p>No questions found with the selected filters.</p>
        )}

        <Modal
          showModal={showMarkschemeModal}
          setShowModal={setShowMarkschemeModal}
          className="max-w-2xl"
        >
          <div className="w-full overflow-hidden md:max-w-2xl md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
            <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
              <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200 uppercase last:mr-0 mr-1">
                AI Generated Solution
              </span>
              <h2 className="font-display text-2xl font-bold">Markscheme</h2>
            </div>
            <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
              <p className="mb-4">
                <MathRenderer text={markschemeContent} />
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default QuestionBank;
