// MockExamGenerator.tsx
import React, { useState, useEffect } from 'react';
import Question from '@/components/shared/Question';

interface QuestionType {
  questionId: string;
  text: string;
  subject: string;
  difficulty: string;
  type: 'Multiple Choice' | 'Numerical';
  options?: string[];
  correctOption?: string;
  markscheme?: string;
}

interface MockExamGeneratorProps {
  onStartExam: (config: any) => void;
  onGenerateQuestionBank: (config: any) => void;
}

const MockExamGenerator: React.FC<MockExamGeneratorProps> = ({ onStartExam, onGenerateQuestionBank }) => {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [examTime, setExamTime] = useState(60);
  const [generateType, setGenerateType] = useState<'mockExam' | 'questionBank'>('mockExam');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    const fetchQuestionsAndSubjects = async () => {
      try {
        const questionsResponse = await fetch('/api/questions');
        if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);

        const subjectsResponse = await fetch('/api/subjects');
        if (!subjectsResponse.ok) throw new Error('Failed to fetch subjects');
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchQuestionsAndSubjects();
  }, []);

  const handleSubjectSelection = (subject: string) => {
    setSelectedSubjects((prevSubjects) =>
      prevSubjects.includes(subject) ? prevSubjects.filter((s) => s !== subject) : [...prevSubjects, subject]
    );
  };

  const handleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prevQuestions) =>
      prevQuestions.includes(questionId) ? prevQuestions.filter((id) => id !== questionId) : [...prevQuestions, questionId]
    );
  };

  const handleGenerate = (type: 'mockExam' | 'questionBank') => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject.');
      return;
    }

    let selectedQuestionsList: any[] = [];
    if (selectedQuestions.length === 0) {
      const questionsPerSubject = Math.floor(numberOfQuestions / selectedSubjects.length);
      selectedSubjects.forEach((subject) => {
        const subjectQuestions = questions.filter((q) => q.subject === subject);
        const shuffledQuestions = subjectQuestions.sort(() => 0.5 - Math.random());
        selectedQuestionsList.push(...shuffledQuestions.slice(0, questionsPerSubject));
      });
    } else {
      selectedQuestionsList = questions.filter((q) => selectedQuestions.includes(q.questionId));
      setNumberOfQuestions(selectedQuestionsList.length);
    }

    if (selectedQuestionsList.length < numberOfQuestions) {
      setError('Not enough questions available to meet your criteria.');
      return;
    }

    const examConfig = { questions: selectedQuestionsList, examTime };

    if (type === 'mockExam') {
      onStartExam(examConfig);
      setShareLink(createShareLink(examConfig));
    } else {
      onGenerateQuestionBank({ questions: selectedQuestionsList });
      setShareLink(createShareLink(examConfig));
    }
  };

  const createShareLink = (config: any) => {
    const data = {
      questions: config.questions.map((q: any) => q.questionId),
      examTime: config.examTime,
    };
    const encodedData = encodeURIComponent(JSON.stringify(data));
    return `${window.location.origin}/share?data=${encodedData}`;
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-semibold text-left mb-8 text-blue-600">Mock Exam Generator</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <label className="block text-sm text-left font-medium text-gray-700 mb-2">Generate Type</label>
        <div className="flex items-center space-x-4">
          <button
            className={`px-4 py-2 rounded-full ${generateType === 'mockExam' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setGenerateType('mockExam')}
          >
            Mock Exam
          </button>
          <button
            className={`px-4 py-2 rounded-full ${generateType === 'questionBank' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setGenerateType('questionBank')}
          >
            Question Bank
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-left font-medium text-gray-700 mb-2">Select Subjects</label>
        <div className="flex flex-wrap space-x-2">
          {subjects.map((subject, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-full border ${selectedSubjects.includes(subject) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => handleSubjectSelection(subject)}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-left font-medium text-gray-700 mb-2">Number of Questions</label>
        <input
          type="number"
          value={numberOfQuestions}
          onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
          className="w-full mt-1 block bg-gray-100 text-gray-800 py-2 px-4 rounded border"
          disabled={selectedQuestions.length > 0}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-left font-medium text-gray-700 mb-2">Exam Time (in minutes)</label>
        <input
          type="number"
          value={examTime}
          onChange={(e) => setExamTime(parseInt(e.target.value))}
          className="w-full mt-1 block bg-gray-100 text-gray-800 py-2 px-4 rounded border"
        />
      </div>

      <div className="mb-6">
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-full mb-4 hover:bg-blue-600 transition duration-300"
          onClick={() => {
            if (selectedSubjects.length === 0) {
              setError('Please select at least one subject before selecting questions.');
            } else {
              setShowQuestions(!showQuestions);
              if (showQuestions) {
                setSelectedQuestions([]);
                setNumberOfQuestions(10);
              } else {
                setError('');
              }
            }
          }}
        >
          {showQuestions ? 'Hide Questions' : 'Select Questions'}
        </button>
        {showQuestions && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions
              .filter((q) => selectedSubjects.includes(q.subject))
              .map((question) => (
                <div key={question.questionId} className="border p-4 rounded-lg shadow-md bg-gray-50 mb-4">
                  <Question
                    question={question}
                    feedback={''}
                    numericalAnswer=""
                    showMarkscheme={false}
                    handleOptionClick={() => {}}
                    handleNumericalSubmit={() => {}}
                    handleNumericalChange={() => {}}
                    handleMarkschemeToggle={() => {}}
                    handleMarkForReview={() => handleQuestionSelection(question.questionId)}
                    handleMarkComplete={() => handleQuestionSelection(question.questionId)}
                    isMarkedForReview={selectedQuestions.includes(question.questionId)}
                    isMarkedComplete={selectedQuestions.includes(question.questionId)}
                    markschemesDisabled={false}
                    note=""
                    handleNoteChange={() => {}}
                    userId=""
                  />
                  <button
                    className={`mt-2 px-4 py-2 rounded ${selectedQuestions.includes(question.questionId) ? 'bg-blue-300 text-white' : 'bg-blue-300 text-white'}`}
                    onClick={() => handleQuestionSelection(question.questionId)}
                  >
                    {selectedQuestions.includes(question.questionId) ? 'Deselect' : 'Select'}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-8 space-x-4">
        <button
          className="border-2 border-black text-black py-3 px-6 rounded-full hover:bg-gray-300 transition duration-300"
          onClick={() => handleGenerate(generateType)}
        >
          Generate
        </button>
        {shareLink && (
          <button
            className="bg-green-500 text-white py-3 px-6 rounded-full hover:bg-green-600 transition duration-300"
            onClick={handleCopyLink}
          >
            Copy Share Link
          </button>
        )}
      </div>
      {shareLink && (
        <div className="mt-6 text-center">
          <p className="text-gray-700">Share this link with others:</p>
          <a href={shareLink} className="text-blue-500 underline">
            {shareLink}
          </a>
        </div>
      )}
    </div>
  );
};

export default MockExamGenerator;
