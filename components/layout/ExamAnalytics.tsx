import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface ExamAnalyticsProps {
  results: {
    answers: { [key: string]: string };
    feedback: { [key: string]: string };
    timeSpent: number;
    markedForReview: string[];
    markedComplete: string[];
    questions: { questionId: string; text: string }[];
  };
}

const ExamAnalytics: React.FC<ExamAnalyticsProps> = ({ results }) => {
  const { answers, feedback, timeSpent, markedForReview, markedComplete, questions } = results;
  const totalQuestions = questions.length;
  const correctAnswers = Object.values(feedback).filter((val) => val === 'correct').length;
  const incorrectAnswers = Object.values(feedback).filter((val) => val === 'incorrect').length;
  const notAttemptedAnswers = totalQuestions - correctAnswers - incorrectAnswers;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const timePerQuestion = timeSpent / totalQuestions;

  const barData = {
    labels: questions.map((q, index) => `Q${index + 1}`),
    datasets: [
      {
        label: 'Time Spent (seconds)',
        data: questions.map((q) => (answers[q.questionId] ? timePerQuestion : 0)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const doughnutData = {
    labels: ['Correct', 'Incorrect', 'Not Attempted'],
    datasets: [
      {
        data: [correctAnswers, incorrectAnswers, notAttemptedAnswers],
        backgroundColor: ['#4caf50', '#f44336', '#9e9e9e'],
      },
    ],
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold mb-4">Exam Analytics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Total Questions</h3>
          <p className="text-2xl">{totalQuestions}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Correct Answers</h3>
          <p className="text-2xl">{correctAnswers}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Incorrect Answers</h3>
          <p className="text-2xl">{incorrectAnswers}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Not Attempted</h3>
          <p className="text-2xl">{notAttemptedAnswers}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Marked for Review</h3>
          <p className="text-2xl">{markedForReview.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Completed</h3>
          <p className="text-2xl">{markedComplete.length}</p>
        </div>
        <div className="bg-emerald-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Time Spent</h3>
          <p className="text-2xl">{formatTime(timeSpent)}</p>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Time Spent on Each Question</h3>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Answer Distribution</h3>
        <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
      </div>
    </div>
  );
};

export default ExamAnalytics;
