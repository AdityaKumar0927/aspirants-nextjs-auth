"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import Question from '@/components/shared/Question';
import Sidebar from '@/components/shared/Sidebar';
import rawQuestionsData from 'public/questions.json';

interface RawQuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: string;
  year: string;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
}

const handleSettingsClick = () => {
  // Handle settings click
};

const handleUserDashboardClick = () => {
  // Handle user dashboard click
};

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: 'Multiple Choice' | 'Numerical';
  year: string;
  reviewed: boolean;
  completed: boolean;
  options?: string[];
  correctOption?: string;
  markscheme?: string;
}

const questionsData: QuestionType[] = (rawQuestionsData as RawQuestionType[]).map(q => ({
  ...q,
  type: q.type as 'Multiple Choice' | 'Numerical',
  reviewed: false,
  completed: false,
}));

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionType[]>(questionsData);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>(questionsData);
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    type: '',
    year: '',
    status: 'all',
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

  const dropdownTimeout = useRef<Record<string, NodeJS.Timeout>>({});

  const filterQuestions = useCallback(() => {
    let filtered = questions.filter(question => {
      return (
        (!filters.subject || question.subject === filters.subject) &&
        (!filters.difficulty || question.difficulty === filters.difficulty) &&
        (!filters.year || question.year === filters.year) &&
        (!filters.type || question.type === filters.type)
      );
    });
  
    if (filters.status === 'review') {
      filtered = filtered.filter(question => question.reviewed);
    } else if (filters.status === 'complete') {
      filtered = filtered.filter(question => question.completed);
    }
  
    setFilteredQuestions(filtered);
  }, [questions, filters]);
  
  useEffect(() => {
    filterQuestions();
  }, [filterQuestions]);
  
  const handleFilterChange = (tag: string, value: string) => {
    setFilters(prevFilters => ({ ...prevFilters, [tag]: value }));
  };

  const handleOptionClick = (questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? 'correct' : 'incorrect',
    });
    markQuestionAsCompleted(questionId);
  };

  const handleNumericalSubmit = (questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? 'correct' : 'incorrect',
    });
    markQuestionAsCompleted(questionId);
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
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.questionId === questionId ? {...q, reviewed: !q.reviewed} : q
      )
    );
  };

  const markQuestionAsCompleted = (questionId: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.questionId === questionId ? {...q, completed: true} : q
      )
    );
  };

  const generatePDF = (type: string) => {
    const doc = new jsPDF();
    if (type === 'questionPaper') {
      doc.text('Question Paper', 10, 10);
      filteredQuestions.forEach((question, index) => {
        doc.text(`${index + 1}. ${question.text}`, 10, 20 + index * 10);
      });
    } else if (type === 'markscheme') {
      doc.text('Markscheme', 10, 10);
      filteredQuestions.forEach((question, index) => {
        doc.text(`${index + 1}. ${question.markscheme || 'No answer available'}`, 10, 20 + index * 10);
      });
    }
    doc.save(`${type}.pdf`);
  };

  const handleMouseEnter = (menu: string) => {
    clearTimeout(dropdownTimeout.current[menu]);
    setDropdowns(prevState => ({
      ...prevState,
      [menu]: true,
    }));
  };

  const handleMouseLeave = (menu: string) => {
    dropdownTimeout.current[menu] = setTimeout(() => {
      setDropdowns(prevState => ({
        ...prevState,
        [menu]: false,
      }));
    }, 100);
  };

  const subjects = Array.from(new Set(questions.map(q => q.subject)));
  const difficulties = Array.from(new Set(questions.map(q => q.difficulty)));
  const years = Array.from(new Set(questions.map(q => q.year)));
  const types = Array.from(new Set(questions.map(q => q.type)));

  return (
    <div className="p-8 min-h-screen flex justify-center">
      <div className="max-w-6xl w-full">
        <nav className="text-sm text-gray-500 mb-4">
          <a href="#" className="hover:underline text-left">Collections</a> &gt; <a href="#" className="hover:underline text-left">Question Bank</a>
        </nav>
        <h1 className="text-3xl font-bold mb-2 text-left">Question Bank</h1>
        <div className="flex space-x-4 mb-6">
          <button 
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2" 
            onClick={() => generatePDF('questionPaper')}
          >
            <i className="fas fa-download"></i>
            <span>Download question paper</span>
          </button>
          <button 
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2"
            onClick={() => generatePDF('markscheme')}
          >
            <i className="fas fa-download"></i>
            <span>Download markscheme</span>
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2">
            <i className="fas fa-ellipsis-h"></i>
            <span>More</span>
          </button>
        </div>
        <div className="flex space-x-4 mb-6">
          <button
            className={`bg-white border-2 border-black text-black px-4 py-2 rounded-md ${filters.status === 'all' ? 'bg-blue-100 border-2 border-blue-300 text-black' : ''}`}
            onClick={() => handleFilterChange('status', 'all')}
          >
            All Questions
          </button>
          <button
            className={`bg-white border-2 border-black text-black px-4 py-2 rounded-md ${filters.status === 'review' ? 'bg-blue-100 border-2 border-blue-300 text-black' : ''}`}
            onClick={() => handleFilterChange('status', 'review')}
          >
            Marked for Review
          </button>
          <button
            className={`bg-white border-2 border-black text-black px-4 py-2 rounded-md ${filters.status === 'complete' ? 'bg-blue-100 border-2 border-blue-300 text-black' : ''}`}
            onClick={() => handleFilterChange('status', 'complete')}
          >
            Completed
          </button>
        </div>
        <div className="flex flex-wrap items-start mb-4 space-x-2">
          {['subject', 'difficulty', 'year', 'type'].map((filterType) => (
            <div
              key={filterType}
              className="relative inline-block mb-2"
              onMouseEnter={() => handleMouseEnter(filterType)}
              onMouseLeave={() => handleMouseLeave(filterType)}
            >
              <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded">
                {filters[filterType as keyof typeof filters] || filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
              {dropdowns[filterType as keyof typeof dropdowns] && (
                <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  {(filterType === 'subject' ? subjects :
                    filterType === 'difficulty' ? difficulties :
                    filterType === 'year' ? years :
                    types).map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        handleFilterChange(filterType, value);
                        setDropdowns({ ...dropdowns, [filterType]: false });
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              handleMarkschemeToggle={handleMarkschemeToggle}
              handleMarkForReview={handleMarkForReview}
              handleMarkComplete={markQuestionAsCompleted}
              isMarkedForReview={question.reviewed}
              isMarkedComplete={question.completed}
            />
          ))
        ) : (
          <p>No questions found with the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;