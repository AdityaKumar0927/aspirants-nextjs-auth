import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand } from '@fortawesome/free-solid-svg-icons';
import QuestionExam from '@/components/shared/QuestionExam';
import { useRouter } from 'next/router';

interface ExamComponentProps {
  questions: any[];
  examTime: number;
  onFinishExam: (result: any) => void;
}

const ExamComponent: React.FC<ExamComponentProps> = ({ questions, examTime, onFinishExam }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState(examTime * 60);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const examRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isExamSubmitted) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isExamSubmitted]);

  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      examRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleOptionClick = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitExam = () => {
    setIsExamSubmitted(true);
    const feedback = questions.reduce((acc, question) => {
      const correct = question.correctOption;
      const userAnswer = answers[question.questionId];
      acc[question.questionId] = userAnswer === correct ? 'correct' : 'incorrect';
      return acc;
    }, {} as Record<string, string>);

    onFinishExam({ answers, feedback });
    router.push('/results');
  };

  return (
    <div ref={examRef} className="max-w-6xl mx-auto p-6 mt-10 flex flex-col md:flex-row bg-white">
      <div className="flex-1 md:pr-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Exam</h1>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-full bg-emerald-400 text-white">
              {Math.floor(remainingTime / 60)}:{remainingTime % 60}
            </div>
            {!isExamSubmitted && (
              <button className="text-black py-2 px-4 rounded-full" onClick={handleFullscreenToggle}>
                <FontAwesomeIcon icon={faExpand} />
              </button>
            )}
          </div>
        </div>
        <QuestionExam
          question={questions[currentQuestionIndex]}
          feedback={answers[questions[currentQuestionIndex].questionId]}
          handleOptionClick={handleOptionClick}
          isExamSubmitted={isExamSubmitted}
          numericalAnswer=""
          showMarkscheme={false}
          handleNumericalSubmit={() => {}}
          handleNumericalChange={() => {}}
          handleMarkschemeToggle={() => {}}
          handleMarkForReview={() => {}}
          handleMarkComplete={() => {}}
          isMarkedForReview={false}
          isMarkedComplete={false}
          selectedAnswer={answers[questions[currentQuestionIndex].questionId] || ''}
        />
        <div className="flex justify-between mt-8">
          <button
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300 transition duration-300"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          <button
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-full hover:bg-gray-300 transition duration-300"
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next
          </button>
          {!isExamSubmitted && (
            <button
              className="text-black border-black border-2 py-2 px-4 rounded-full hover:bg-gray-300 transition duration-300"
              onClick={handleSubmitExam}
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>
      <div className="w-full md:w-1/4 border-l-2 border-gray-300 pl-4 mt-4 md:mt-0">
        <h2 className="text-xl text-left font-bold mb-4">Questions</h2>
        <div className="grid grid-cols-3 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`py-2 px-4 text-black rounded-lg ${index === currentQuestionIndex ? 'border-blue-200 border-2' : 'border-2 border-black'}`}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamComponent;
