"use client";

import React, { useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import MathRenderer from "@/components/layout/MathRenderer2";
import { Line } from "react-chartjs-2";
import "katex/dist/katex.min.css";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Limits: NextPage = () => {
  const [quizAnswer, setQuizAnswer] = useState<{ [key: string]: string | null }>({});
  const [feedback, setFeedback] = useState<{ [key: string]: string | null }>({});
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<string[]>([]);

  const handleQuizSubmit = (question: string, answer: string, correctAnswer: string) => {
    setQuizAnswer({ ...quizAnswer, [question]: answer });
    if (answer === correctAnswer) {
      setFeedback({ ...feedback, [question]: "That's correct!" });
    } else {
      setFeedback({ ...feedback, [question]: "Incorrect. Try again." });
    }
  };

  const handleChatSubmit = () => {
    if (chatInput.trim() !== "") {
      setChatMessages([...chatMessages, chatInput]);
      setChatInput("");
    }
  };

  const chartData = {
    labels: Array.from({ length: 21 }, (_, i) => i - 10),
    datasets: [
      {
        label: "g(x)",
        data: Array.from({ length: 21 }, (_, i) => ((i - 10) * (i - 10)) / 10),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: "Graph of g(x) = (x-10)^2/10",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "x",
        },
      },
      y: {
        title: {
          display: true,
          text: "g(x)",
        },
      },
    },
  };

  return (
    <>
      <Head>
        <title>Limits</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/katex/0.13.11/katex.min.css" rel="stylesheet" />
      </Head>
      <div className="bg-white w-11/12 h-11/12 border border-gray rounded">
        <div className="max-w-4xl mx-auto p-6 text-gray-900">
          <h1 className="text-3xl font-bold mb-6">Limits in Calculus: A Comprehensive Guide</h1>

          <h2 className="text-2xl font-semibold mb-4">Definition of a Limit</h2>
          <div className="mb-4">
            <p>
              A limit is a fundamental concept in calculus and mathematical analysis concerning the behavior of a function as its argument approaches a particular value. Formally, the limit of a function <MathRenderer text={`f(x)`} /> as <MathRenderer text={`x`} /> approaches <MathRenderer text={`c`} /> is <MathRenderer text={`L`} />, written as:
            </p>
          </div>
          <div className="mb-4 text-center">
            <MathRenderer text={`\\lim_{x \\to c} f(x) = L`} />
          </div>

          <h2 className="text-2xl font-semibold mb-4">Formal Definition (ε-δ Definition)</h2>
          <div className="mb-4">
            <p>For a limit <MathRenderer text={`\\lim_{x \\to c} f(x) = L`} /> to exist:</p>
            <p>
              For every <MathRenderer text={`\\epsilon > 0`} />, there exists a <MathRenderer text={`\\delta > 0`} /> such that if <MathRenderer text={`0 < |x - c| < \\delta`} />, then <MathRenderer text={`|f(x) - L| < \\epsilon`} />.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mb-4">One-Sided Limits</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><MathRenderer text={`\\lim_{x \\to c^+} f(x) = L`} /> (Right-Hand Limit)</li>
            <li><MathRenderer text={`\\lim_{x \\to c^-} f(x) = L`} /> (Left-Hand Limit)</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Infinite Limits and Limits at Infinity</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><MathRenderer text={`\\lim_{x \\to c} f(x) = \\infty`} /> means <MathRenderer text={`f(x)`} /> increases without bound as <MathRenderer text={`x`} /> approaches <MathRenderer text={`c`} />.</li>
            <li><MathRenderer text={`\\lim_{x \\to \\infty} f(x) = L`} /> means <MathRenderer text={`f(x)`} /> approaches <MathRenderer text={`L`} /> as <MathRenderer text={`x`} /> increases without bound.</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Common Limit Laws</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><MathRenderer text={`\\lim_{x \\to c} [f(x) + g(x)] = \\lim_{x \\to c} f(x) + \\lim_{x \\to c} g(x)`} /> (Sum Law)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} [f(x) - g(x)] = \\lim_{x \\to c} f(x) - \\lim_{x \\to c} g(x)`} /> (Difference Law)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} [f(x) \\cdot g(x)] = \\lim_{x \\to c} f(x) \\cdot \\lim_{x \\to c} g(x)`} /> (Product Law)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\frac{\\lim_{x \\to c} f(x)}{\\lim_{x \\to c} g(x)}`} />, provided <MathRenderer text={`\\lim_{x \\to c} g(x) \\neq 0`} /> (Quotient Law)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} [f(x)]^n = \\left[\\lim_{x \\to c} f(x)\\right]^n`} /> (Power Law)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} \\sqrt[n]{f(x)} = \\sqrt[n]{\\lim_{x \\to c} f(x)}`} /> (Root Law)</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Special Limits</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><MathRenderer text={`\\lim_{x \\to c} k = k`} /> (Limit of a Constant)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} x = c`} /> (Limit of Identity Function)</li>
            <li><MathRenderer text={`\\lim_{x \\to c} \\frac{P(x)}{Q(x)} = \\frac{P(c)}{Q(c)}`} />, provided <MathRenderer text={`Q(c) \\neq 0`} /> (Limit of Rational Functions)</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">Visual Examples</h2>

          <h3 className="text-xl font-semibold mb-2">Example 1: Basic Function</h3>
          <div className="mb-4">
            <p>Consider the function <MathRenderer text={`f(x) = 2x + 1`} />. The limit as <MathRenderer text={`x`} /> approaches 3 is:</p>
          </div>
          <div className="mb-4 text-center">
            <MathRenderer text={`\\lim_{x \\to 3} (2x + 1) = 2(3) + 1 = 7`} />
          </div>
          <div className="flex justify-center mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <h3 className="text-xl font-semibold mb-2">Example 2: Piecewise Function</h3>
          <div className="mb-4">
            <MathRenderer text={`f(x) = \\begin{cases} 
x^2 & \\text{if } x \\leq 1 \\\\
2x + 1 & \\text{if } x > 1 
\\end{cases}`} />
          </div>
          <div className="mb-4">
            <p>To find the limit as <MathRenderer text={`x`} /> approaches 1 from the left:</p>
            <div className="mb-4 text-center">
              <MathRenderer text={`\\lim_{x \\to 1^-} f(x) = 1^2 = 1`} />
            </div>
            <p>And from the right:</p>
            <div className="mb-4 text-center">
              <MathRenderer text={`\\lim_{x \\to 1^+} f(x) = 2(1) + 1 = 3`} />
            </div>
            <p>Since the left-hand limit and right-hand limit are not equal, the limit at <MathRenderer text={`x = 1`} /> does not exist.</p>
          </div>

          <h3 className="text-xl font-semibold mb-2">Example 3: Infinite Limits</h3>
          <div className="mb-4">
            <MathRenderer text={`f(x) = \\frac{1}{x}`} />
            <p>As <MathRenderer text={`x`} /> approaches 0 from the positive side, <MathRenderer text={`f(x)`} /> approaches infinity:</p>
          </div>
          <div className="mb-4 text-center">
            <MathRenderer text={`\\lim_{x \\to 0^+} \\frac{1}{x} = \\infty`} />
          </div>
          <div className="mb-4">
            <p>And from the negative side, it approaches negative infinity:</p>
          </div>
          <div className="mb-4 text-center">
            <MathRenderer text={`\\lim_{x \\to 0^-} \\frac{1}{x} = -\\infty`} />
          </div>

          <h2 className="text-2xl font-semibold mb-4">Quiz</h2>

          {/* Quiz Question 1 */}
          <div className="mb-4 border border-gray-300 p-4 rounded-lg">
            <p className="font-semibold mb-2">Question 1: What is a reasonable estimate for <MathRenderer text={`\\lim_{x \\to 1} g(x)`} />?</p>
            <div className="flex justify-center mb-6">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="mb-2">Choose 1 answer:</div>
            <ul className="list-none mb-4">
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer1"
                    value="A"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question1", e.target.value, "C")}
                  />
                  <span className="ml-2">A. −1.9</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer1"
                    value="B"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question1", e.target.value, "C")}
                  />
                  <span className="ml-2">B. −1.4</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer1"
                    value="C"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question1", e.target.value, "C")}
                  />
                  <span className="ml-2">C. 1</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer1"
                    value="D"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question1", e.target.value, "C")}
                  />
                  <span className="ml-2">D. The limit doesn&apos;t exist.</span>
                </label>
              </li>
            </ul>
            {feedback["question1"] && (
              <div className={`p-4 rounded-lg ${quizAnswer["question1"] === "C" ? "bg-green-100 border-green-500 text-green-700" : "bg-red-100 border-red-500 text-red-700"}`}>
                <p>{feedback["question1"]}</p>
              </div>
            )}
          </div>

          {/* Quiz Question 2 */}
          <div className="mb-4 border border-gray-300 p-4 rounded-lg">
            <p className="font-semibold mb-2">Question 2: What is the limit of <MathRenderer text={`f(x) = \\frac{2x^2 - 3x + 1}{x - 1}`} /> as <MathRenderer text={`x`} /> approaches 1?</p>
            <div className="mb-2">Choose 1 answer:</div>
            <ul className="list-none mb-4">
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer2"
                    value="A"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question2", e.target.value, "A")}
                  />
                  <span className="ml-2">A. 1</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer2"
                    value="B"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question2", e.target.value, "A")}
                  />
                  <span className="ml-2">B. 0</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer2"
                    value="C"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question2", e.target.value, "A")}
                  />
                  <span className="ml-2">C. Infinity</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer2"
                    value="D"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question2", e.target.value, "A")}
                  />
                  <span className="ml-2">D. Does not exist</span>
                </label>
              </li>
            </ul>
            {feedback["question2"] && (
              <div className={`p-4 rounded-lg ${quizAnswer["question2"] === "A" ? "bg-green-100 border-green-500 text-green-700" : "bg-red-100 border-red-500 text-red-700"}`}>
                <p>{feedback["question2"]}</p>
              </div>
            )}
          </div>

          {/* Quiz Question 3 */}
          <div className="mb-4 border border-gray-300 p-4 rounded-lg">
            <p className="font-semibold mb-2">Question 3: What is the limit of <MathRenderer text={`f(x) = \\sqrt{x}`} /> as <MathRenderer text={`x`} /> approaches 4?</p>
            <div className="mb-2">Choose 1 answer:</div>
            <ul className="list-none mb-4">
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer3"
                    value="A"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question3", e.target.value, "B")}
                  />
                  <span className="ml-2">A. 2</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer3"
                    value="B"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question3", e.target.value, "B")}
                  />
                  <span className="ml-2">B. 4</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer3"
                    value="C"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question3", e.target.value, "B")}
                  />
                  <span className="ml-2">C. 6</span>
                </label>
              </li>
              <li className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="answer3"
                    value="D"
                    className="form-radio text-blue-600"
                    onChange={(e) => handleQuizSubmit("question3", e.target.value, "B")}
                  />
                  <span className="ml-2">D. 8</span>
                </label>
              </li>
            </ul>
            {feedback["question3"] && (
              <div className={`p-4 rounded-lg ${quizAnswer["question3"] === "B" ? "bg-green-100 border-green-500 text-green-700" : "bg-red-100 border-red-500 text-red-700"}`}>
                <p>{feedback["question3"]}</p>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-semibold mb-4">Ask Your Doubts</h2>
          <div className="mb-4">
            <div className="border border-gray-300 p-4 rounded-lg">
              <div className="mb-4">
                {chatMessages.map((msg, index) => (
                  <p key={index} className="bg-gray-100 p-2 rounded mb-2">{msg}</p>
                ))}
              </div>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your doubts here..."
                className="w-full p-2 border border-gray-300 rounded mb-2"
              />
              <button onClick={handleChatSubmit} className="px-4 py-2 bg-black text-white rounded">Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Limits;
