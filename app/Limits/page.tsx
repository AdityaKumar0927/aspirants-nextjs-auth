"use client";

import React, { useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import MathRenderer from "@/components/layout/MathRenderer2";
import { Line } from "react-chartjs-2";
import "katex/dist/katex.min.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip
);

const Limits: NextPage = () => {
  const [quizAnswer, setQuizAnswer] = useState<{ [key: string]: string | null }>({});
  const [feedback, setFeedback] = useState<{ [key: string]: string | null }>({});

  const handleQuizSubmit = (question: string, answer: string, correctAnswer: string) => {
    setQuizAnswer({ ...quizAnswer, [question]: answer });
    if (answer === correctAnswer) {
      setFeedback({ ...feedback, [question]: "That's correct!" });
    } else {
      setFeedback({ ...feedback, [question]: "Incorrect. Try again." });
    }
  };

  const chartData = {
    labels: Array.from({ length: 21 }, (_, i) => i - 10),
    datasets: [
      {
        label: "g(x)",
        data: Array.from({ length: 21 }, (_, i) => ((i - 10) * (i - 10)) / 10),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Graph of g(x) = (x-10)^2/10",
        font: {
          size: 18,
        },
        color: "#1F2937",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "x",
          font: {
            size: 14,
          },
          color: "#1F2937",
        },
      },
      y: {
        title: {
          display: true,
          text: "g(x)",
          font: {
            size: 14,
          },
          color: "#1F2937",
        },
      },
    },
  };

  return (
    <>
      <Head>
        <title>Limits</title>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/katex/0.13.11/katex.min.css"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-white flex flex-col py-12">
        <div className="w-full max-w-4xl mx-auto px-6">
          <h1 className="font-display text-4xl font-bold tracking-tight text-center text-gray-900 mb-10 sm:text-5xl sm:leading-[5rem]">
            Understanding Limits in Calculus
          </h1>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Definition of a Limit
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              A limit is a fundamental concept in calculus concerning the
              behavior of a function as its argument approaches a particular
              value. Formally, the limit of a function <MathRenderer text={`f(x)`} /> as{" "}
              <MathRenderer text={`x`} /> approaches <MathRenderer text={`c`} /> is{" "}
              <MathRenderer text={`L`} />, written as:
            </p>
            <div className="text-center">
              <MathRenderer text={`\\lim_{x \\to c} f(x) = L`} />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              One-Sided Limits
            </h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-3">
              <li className="flex items-baseline">
                <MathRenderer text={`\\lim_{x \\to c^+} f(x) = L`} />
                <span className="ml-2">(Right-Hand Limit)</span>
              </li>
              <li className="flex items-baseline">
                <MathRenderer text={`\\lim_{x \\to c^-} f(x) = L`} />
                <span className="ml-2">(Left-Hand Limit)</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Infinite Limits
            </h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-3">
              <li className="flex items-baseline">
                <MathRenderer text={`\\lim_{x \\to c} f(x) = \\infty`} />
                <span className="ml-2">
                  means <MathRenderer text={`f(x)`} /> increases without bound as{" "}
                  <MathRenderer text={`x`} /> approaches <MathRenderer text={`c`} />.
                </span>
              </li>
              <li className="flex items-baseline">
                <MathRenderer text={`\\lim_{x \\to \\infty} f(x) = L`} />
                <span className="ml-2">
                  means <MathRenderer text={`f(x)`} /> approaches{" "}
                  <MathRenderer text={`L`} /> as <MathRenderer text={`x`} /> increases
                  without bound.
                </span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Visual Example
            </h2>
            <div className="flex justify-center mb-8 border border-gray-300 rounded-lg p-4 bg-gray-50">
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

          <section className="mb-10 w-full bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Quiz</h2>
            <div className="space-y-8">
              <div className="p-6 bg-white border border-gray-300 rounded-lg">
                <p className="font-medium text-gray-800 mb-4">
                  Question 1: What is a reasonable estimate for{" "}
                  <MathRenderer text={`\\lim_{x \\to 1} g(x)`} />?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {['A. −1.9', 'B. −1.4', 'C. 1', "D. The limit doesn't exist."].map((option, index) => (
                    <button
                      key={index}
                      className="bg-white border border-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-200 transition"
                      onClick={() => handleQuizSubmit("question1", option.charAt(0), "C")}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {feedback["question1"] && (
                  <div
                    className={`p-4 mt-4 rounded-lg ${
                      quizAnswer["question1"] === "C"
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-red-100 border-red-500 text-red-700"
                    }`}
                  >
                    <p>{feedback["question1"]}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Limits;
