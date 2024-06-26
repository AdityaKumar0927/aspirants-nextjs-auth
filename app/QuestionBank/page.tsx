// src/app/QuestionBank/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import { Switch } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCog } from '@fortawesome/free-solid-svg-icons';
import Question from '@/components/shared/Question';
import Sidebar from '@/components/shared/Sidebar';
import Modal from '@/components/shared/modal';
import MathRenderer from '@/components/layout/MathRenderer';
import { useSession } from 'next-auth/react';

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
  notes?: string;
}

const QuestionBank: React.FC = () => {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionType[]>([]);
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
  const [markschemeContent, setMarkschemeContent] = useState<string>('');
  const [showMarkschemeModal, setShowMarkschemeModal] = useState<boolean>(false);
  const [markschemesDisabled, setMarkschemesDisabled] = useState<boolean>(false); // State for disabling markschemes
  const [notes, setNotes] = useState<Record<string, string>>({}); // State for notes
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const dropdownTimeout = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      const response = await fetch('/api/questions');
      const data: QuestionType[] = await response.json();
      setQuestions(data);
      setFilteredQuestions(data);
    };

    fetchQuestions();
  }, []);

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

  const handleOptionClick = async (questionId: string, option: string, correctOption: string) => {
    const isCorrect = option === correctOption;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? 'correct' : 'incorrect',
    });
    await markQuestionAsCompleted(questionId);
    await saveUserData();  // Save data after change
  };

  const handleNumericalSubmit = async (questionId: string, userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer === correctAnswer;
    setFeedback({
      ...feedback,
      [questionId]: isCorrect ? 'correct' : 'incorrect',
    });
    await markQuestionAsCompleted(questionId);
    await saveUserData();  // Save data after change
  };

  const handleNumericalChange = (questionId: string, value: string) => {
    setNumericalAnswers({
      ...numericalAnswers,
      [questionId]: value,
    });
  };

  const handleMarkschemeToggle = (questionId: string) => {
    if (markschemesDisabled) return; // Prevent showing markscheme if disabled
    const question = questions.find(q => q.questionId === questionId);
    if (question) {
      setMarkschemeContent(question.markscheme || 'No markscheme available.');
      setShowMarkschemeModal(true);
    }
  };

  const handleMarkForReview = async (questionId: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.questionId === questionId ? {...q, reviewed: !q.reviewed} : q
      )
    );
    await saveUserData();  // Save data after change
  };

  const markQuestionAsCompleted = async (questionId: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.questionId === questionId ? {...q, completed: !q.completed} : q // Toggle completion status
      )
    );
    await saveUserData();  // Save data after change
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

  const handleNoteChange = async (questionId: string, note: string) => {
    setNotes({
      ...notes,
      [questionId]: note,
    });
    await saveUserData();  // Save data after change
  };

  const toggleMarkscheme = async () => {
    setMarkschemesDisabled(!markschemesDisabled);
    await saveUserData();  // Save data after change
  };

  const saveUserData = async () => {
    if (!session) return;

    const userData = {
      completedQuestions: questions.filter(q => q.completed).map(q => q.questionId),
      markedForReviewQuestions: questions.filter(q => q.reviewed).map(q => q.questionId),
      notes,
    };

    await fetch('/api/saveUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session) return;

      const response = await fetch('/api/getUserData');
      const userData = await response.json();

      setQuestions(prevQuestions => prevQuestions.map(q => ({
        ...q,
        completed: userData.completedQuestions.includes(q.questionId),
        reviewed: userData.markedForReviewQuestions.includes(q.questionId),
      })));

      setNotes(userData.notes);
    };

    fetchUserData();
  }, [session]);

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
            <FontAwesomeIcon icon={faDownload} />
            <span>Download question paper</span>
          </button>
          <button 
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2"
            onClick={() => generatePDF('markscheme')}
          >
            <FontAwesomeIcon icon={faDownload} />
            <span>Download markscheme</span>
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
              markschemesDisabled={markschemesDisabled}
              note={notes[question.questionId] || ''}
              handleNoteChange={handleNoteChange}
            />
          ))
        ) : (
          <p>No questions found with the selected filters.</p>
        )}

        <Modal showModal={showMarkschemeModal} setShowModal={setShowMarkschemeModal} className="max-w-2xl">
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

        <Modal showModal={showSettingsModal} setShowModal={setShowSettingsModal} className="max-w-sm">
          <div className="w-full overflow-hidden md:max-w-sm md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
            <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
              <h2 className="font-display text-2xl font-bold">Settings</h2>
            </div>
            <div className="overflow-y-auto max-h-[60vh] px-4 py-6 text-left text-gray-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">Enable Markscheme</span>
                <Switch
                  checked={!markschemesDisabled}
                  onChange={toggleMarkscheme}
                  className={`${
                    !markschemesDisabled ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full`}
                >
                  <span
                    className={`${
                      !markschemesDisabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                  />
                </Switch>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default QuestionBank;
