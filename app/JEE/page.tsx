"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "katex/dist/katex.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Question from "@/components/shared/Question";
import rawQuestionsData from "public/questions.json";
import Modal from "@/components/shared/modal";
import MathRenderer from "@/components/layout/MathRenderer";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";

interface RawQuestionType {
    questionId: string;
    text: string;
    subject: string;
    difficulty: string;
    type: string;
    year: string;
    options?: string[];
    correctOption?: number;
    markscheme?: string;
  }
  
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
  
  
  const questionsData: QuestionType[] = rawQuestionsData.map(
    (q) => ({
      ...q,
      type: q.type as "Multiple Choice" | "Numerical",
      correctOption: q.correctOption !== undefined ? q.correctOption.toString() : undefined,
      reviewed: false,
      completed: false,
      notes: "",
    })
  );
  
  // Output the transformed questionsData for verification
  console.log(questionsData);
  

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>(questionsData);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>(
    questionsData
  );
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
  const [numericalAnswers, setNumericalAnswers] = useState<
    Record<string, string>
  >({});
  const [showMarkscheme, setShowMarkscheme] = useState<
    Record<string, boolean>
  >({});
  const [markschemeContent, setMarkschemeContent] = useState<string>("");
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(
    false
  );
  const [notes, setNotes] = useState<Record<string, string>>({}); // State for notes

  const dropdownTimeout = useRef<Record<string, NodeJS.Timeout>>({});

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

  const handleOptionClick = (
    questionId: string,
    option: string,
    correctOption: string
  ) => {
    const isCorrect = option === correctOption;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });
  };

  const handleNumericalSubmit = (
    questionId: string,
    userAnswer: string,
    correctAnswer: string
  ) => {
    const isCorrect = userAnswer === correctAnswer;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? "correct" : "incorrect",
    });
  };

  const handleNumericalChange = (questionId: string, value: string) => {
    setNumericalAnswers({
      ...numericalAnswers,
      [questionId]: value,
    });
  };

  const handleMarkschemeToggle = (questionId: string, markscheme: string) => {
    setMarkschemeContent(markscheme);
    
  };

  const handleMarkForReview = (questionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.questionId === questionId ? { ...q, reviewed: !q.reviewed } : q
      )
    );
  };

  const handleMarkComplete = (questionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.questionId === questionId ? { ...q, completed: true } : q
      )
    );
  };

  const generatePDF = async () => {
    const doc = new jsPDF();

    // Generate Question Paper
    const questionPaperElement = document.createElement("div");
    questionPaperElement.style.padding = "10px";
    questionPaperElement.style.fontSize = "12px";
    questionPaperElement.innerHTML = "<h1>Question Paper</h1>";
    filteredQuestions.forEach((question, index) => {
      const questionElement = document.createElement("div");
      questionElement.innerHTML = `<p>${index + 1}. ${question.text}</p>`;
      if (question.options) {
        const optionsList = document.createElement("ul");
        question.options.forEach((option, optionIndex) => {
          const optionItem = document.createElement("li");
          optionItem.innerHTML = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
          optionsList.appendChild(optionItem);
        });
        questionElement.appendChild(optionsList);
      }
      questionPaperElement.appendChild(questionElement);
    });

    const questionPaperCanvas = await html2canvas(questionPaperElement);
    const questionPaperImage = questionPaperCanvas.toDataURL("image/png");
    doc.addImage(questionPaperImage, "PNG", 10, 10, 180, 160);

    // Add a new page for the markscheme
    doc.addPage();
    const markschemeElement = document.createElement("div");
    markschemeElement.style.padding = "10px";
    markschemeElement.style.fontSize = "12px";
    markschemeElement.innerHTML = "<h1>Markscheme</h1>";
    filteredQuestions.forEach((question, index) => {
      const markschemeQuestionElement = document.createElement("div");
      markschemeQuestionElement.innerHTML = `<p>${index + 1}. ${question.markscheme || "No answer available"}</p>`;
      markschemeElement.appendChild(markschemeQuestionElement);
    });

    const markschemeCanvas = await html2canvas(markschemeElement);
    const markschemeImage = markschemeCanvas.toDataURL("image/png");
    doc.addImage(markschemeImage, "PNG", 10, 10, 180, 160);

    doc.save(`Combined.pdf`);
  };

  const handleMouseEnter = (menu: string) => {
    clearTimeout(dropdownTimeout.current[menu]);
    setDropdowns((prevState) => ({
      ...prevState,
      [menu]: true,
    }));
  };

  const handleMouseLeave = (menu: string) => {
    dropdownTimeout.current[menu] = setTimeout(() => {
      setDropdowns((prevState) => ({
        ...prevState,
        [menu]: false,
      }));
    }, 100);
  };

  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const difficulties = Array.from(new Set(questions.map((q) => q.difficulty)));
  const years = Array.from(new Set(questions.map((q) => q.year)));
  const types = Array.from(new Set(questions.map((q) => q.type)));

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
         JEE Question Bank
        </h1>
        <div className="flex space-x-4 mb-6">
        </div>
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
                  ).map((value) => (
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
        </div>

        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <Question
              key={question.questionId}
              question={question}
              feedback={feedback[question.questionId]}
              numericalAnswer={numericalAnswers[question.questionId]}
              showMarkscheme={showMarkscheme[question.questionId]}
              handleOptionClick={handleOptionClick}
              handleNumericalSubmit={handleNumericalSubmit}
              handleNumericalChange={handleNumericalChange}
              handleMarkschemeToggle={() =>
                handleMarkschemeToggle(
                  question.questionId,
                  question.markscheme || "No markscheme available"
                )
              }
              handleMarkForReview={handleMarkForReview}
              handleMarkComplete={handleMarkComplete}
              isMarkedForReview={question.reviewed}
              isMarkedComplete={question.completed}
              markschemesDisabled={false}
              note={notes[question.questionId] || ""}
              handleNoteChange={handleNoteChange}
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
