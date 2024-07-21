"use client";

import React, { useState, useEffect, useCallback } from "react";
import Question from "@/components/shared/Question";
import Popover from "@/components/shared/popover";
import { ChevronDown } from "lucide-react";
import sampleQuestions from "@/components/shared/sampleQuestions.json";

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
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

const MainContent: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>(sampleQuestions as QuestionType[]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>(questions);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
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

  const handleFilterChange = (tag: keyof FiltersType, value: string) => {
    setFilters((prevFilters) => {
      const filterValues = prevFilters[tag] || [];
      if (isStringArray(filterValues)) {
        const isSelected = filterValues.includes(value);
        const updatedFilter = isSelected
          ? filterValues.filter((v: string) => v !== value)
          : [...filterValues, value];
        console.log(`Filter Change - ${tag}:`, updatedFilter);
        return { ...prevFilters, [tag]: updatedFilter };
      }
      return prevFilters;
    });
  };

  const filterQuestions = useCallback(() => {
    let filtered = questions.filter((question) => {
      return (
        (!filters.exams.length || filters.exams.includes(question.exam)) &&
        (!filters.subjects.length || filters.subjects.includes(question.subject)) &&
        (!filters.topics.length || filters.topics.includes(question.topic)) &&
        (!filters.subtopics.length || filters.subtopics.includes(question.subtopic)) &&
        (!filters.difficulties.length || filters.difficulties.includes(question.difficulty)) &&
        (!filters.years.length || filters.years.includes(question.year)) &&
        (!filters.types.length || filters.types.includes(question.type))
      );
    });

    if (filters.status === "review") {
      filtered = filtered.filter((question) => question.reviewed);
    } else if (filters.status === "complete") {
      filtered = filtered.filter((question) => question.completed);
    }

    setFilteredQuestions(filtered);
    console.log("Applied Filters:", filters);
    console.log("Filtered Questions:", filtered);
  }, [questions, filters]);

  useEffect(() => {
    filterQuestions();
  }, [filters, filterQuestions]);

  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    setFeedback({
      ...feedback,
      [questionId]: option === correctOption ? 'correct' : 'incorrect',
    });
  };

  const handleNumericalSubmit = (questionId: string, userAnswer: string, correctAnswer: string) => {
    setFeedback({
      ...feedback,
      [questionId]: userAnswer === correctAnswer ? 'correct' : 'incorrect',
    });
  };

  const handleNumericalChange = (questionId: string, value: string) => {
    setNumericalAnswers({
      ...numericalAnswers,
      [questionId]: value,
    });
  };

  const handleMarkschemeToggle = (questionId: string) => {
    setShowMarkscheme((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
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
        q.questionId === questionId ? { ...q, completed: !q.completed } : q
      )
    );
  };

  const handleOptionClickLocal = (questionId: string, option: string, correctOption: string) => {
    if (selectedOptions[questionId] === option) {
      setSelectedOptions({
        ...selectedOptions,
        [questionId]: ''
      });
      handleOptionClick(questionId, '', correctOption);
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: false } : q
        )
      );
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [questionId]: option
      });
      handleOptionClick(questionId, option, correctOption);
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.questionId === questionId ? { ...q, completed: true } : q
        )
      );
    }
  };

  const handleDeleteNote = async (questionId: string): Promise<void> => {
    return new Promise((resolve) => resolve());
  };

  return (
    <div className="bg-white w-full h-full p-4 sm:p-8 min-h-screen flex justify-center">
      <div className="max-w-6xl w-full">
        <div className="flex space-x-4 mb-6"></div>

        <div className="flex space-x-4 mb-2">
          {["all", "complete", "review"].map((status) => (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status })}
              className={`px-4 py-2 rounded-md ${
                filters.status === status
                  ? "bg-white border hover:border-black border-gray-600 text-gray-500"
                  : "bg-white hover:border-black border border-gray-300 text-gray-500"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
          {["exam", "subject", "topic", "subtopic", "difficulty", "year", "type"].map((filterType) => (
            <Popover
              key={filterType}
              content={
                <div className="w-full bg-white rounded-md p-2 sm:w-40">
                  {(filterType === "exam"
                    ? [...new Set(questions.map((q) => q.exam))]
                    : filterType === "subject"
                    ? [...new Set(questions.map((q) => q.subject))]
                    : filterType === "topic"
                    ? [...new Set(questions.map((q) => q.topic))]
                    : filterType === "subtopic"
                    ? [...new Set(questions.map((q) => q.subtopic))]
                    : filterType === "difficulty"
                    ? [...new Set(questions.map((q) => q.difficulty))]
                    : filterType === "year"
                    ? [...new Set(questions.map((q) => q.year))]
                    : [...new Set(questions.map((q) => q.type))]
                  ).map((value: string) => (
                    <div key={value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${filterType}-${value}`}
                        className="mr-2"
                        checked={(filters[filterType as keyof FiltersType] || []).includes(value)}
                        onChange={() => handleFilterChange(filterType as keyof FiltersType, value)}
                      />
                      <label
                        htmlFor={`${filterType}-${value}`}
                        className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
                      >
                        {value}
                      </label>
                    </div>
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
                  {isStringArray(filters[filterType as keyof FiltersType])
                    ? (filters[filterType as keyof FiltersType] as string[]).length
                      ? `${(filters[filterType as keyof FiltersType] as string[]).length} selected`
                      : filterType.charAt(0).toUpperCase() + filterType.slice(1)
                    : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
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
              handleOptionClick={(questionId, option, correctOption) =>
                handleOptionClickLocal(questionId, option, correctOption)
              }
              handleNumericalSubmit={handleNumericalSubmit}
              handleNumericalChange={handleNumericalChange}
              handleMarkschemeToggle={handleMarkschemeToggle}
              handleMarkForReview={() => handleMarkForReview(question.questionId)}
              handleMarkComplete={() => handleMarkComplete(question.questionId)}
              isMarkedForReview={questions.find(q => q.questionId === question.questionId)?.reviewed || false}
              isMarkedComplete={questions.find(q => q.questionId === question.questionId)?.completed || false}
              markschemesDisabled={false}
              note=""
              handleNoteChange={() => {}}
              handleDeleteNote={handleDeleteNote}
              userId="user-id-placeholder" // Replace with actual user ID
            />
          ))
        ) : (
          <p>No questions found with the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default MainContent;
