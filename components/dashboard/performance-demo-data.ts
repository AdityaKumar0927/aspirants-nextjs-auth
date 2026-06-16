import type { StatsDemoData } from "@/components/shared/Stats";

/**
 * Populated sample data so the home-page "Review Your Performance" preview can
 * render the REAL <Stats> component looking full — signed-out visitors have no
 * data of their own. All values are fixed (no Date.now) so SSR and the client
 * render identically (clean hydration).
 */
const TOPICS = [
  { topic: "Kinematics", correct: 42, incorrect: 8, reAcc: 91 },
  { topic: "Thermodynamics", correct: 31, incorrect: 14, reAcc: 79 },
  { topic: "Organic Chemistry", correct: 55, incorrect: 12, reAcc: 88 },
  { topic: "Calculus", correct: 38, incorrect: 22, reAcc: 74 },
  { topic: "Electrostatics", correct: 27, incorrect: 9, reAcc: 83 },
  { topic: "Optics", correct: 19, incorrect: 6, reAcc: 84 },
  { topic: "Modern Physics", correct: 33, incorrect: 11, reAcc: 80 },
  { topic: "Coordination Compounds", correct: 22, incorrect: 13, reAcc: 71 },
];

export const PERFORMANCE_DEMO: StatsDemoData = {
  userName: "Aspirant",
  filterOptions: {
    exams: ["JEE Main", "JEE Advanced", "NEET"],
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    topics: TOPICS.map((t) => t.topic),
    subtopics: [
      "Projectile Motion",
      "Heat Engines",
      "Aldehydes & Ketones",
      "Integration",
      "Capacitors",
    ],
    difficulties: ["Easy", "Medium", "Hard"],
    years: ["2021", "2022", "2023", "2024"],
    types: ["Multiple Choice", "Numerical"],
  },
  performance: TOPICS.map((t, i) => {
    const attempts = t.correct + t.incorrect;
    return {
      questionId: `demo-${i + 1}`,
      userId: "demo",
      correctAnswers: t.correct,
      incorrectAnswers: t.incorrect,
      questionsAttempted: attempts,
      accuracy: Number(((t.correct / attempts) * 100).toFixed(1)),
      reattemptAccuracy: t.reAcc,
      createdAt: `2024-0${(i % 9) + 1}-15`,
      topicPerformance: { [t.topic]: { attempts, correct: t.correct } },
    };
  }),
  progress: Array.from({ length: 12 }, (_, i) => ({
    id: `prog-${i + 1}`,
    userId: "demo",
    questionId: `demo-${i + 1}`,
    completed: i % 3 !== 0,
    reviewed: i % 4 === 0,
    lastAttempted: `2024-05-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  answers: Array.from({ length: 12 }, (_, i) => ({
    id: `ans-${i + 1}`,
    userId: "demo",
    questionId: `demo-${i + 1}`,
    selectedOption: ["A", "B", "C", "D"][i % 4],
    isCorrect: i % 3 !== 1,
  })),
};
