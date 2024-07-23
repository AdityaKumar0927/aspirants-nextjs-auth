const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const questions = [
  {
      "exam": "CUET",
      "questionId": "1",
      "text": "If \\(f(x) = \\begin{cases} 2m x + \\sin x, & \\text{if } x \\leq \\frac{\\pi}{2} \\\\ n x + \\cos x, & \\text{if } x > \\frac{\\pi}{2} \\end{cases}\\) is continuous at \\(x = \\frac{\\pi}{2}\\), then",
      "subject": "Mathematics",
      "topic": "Calculus",
      "subtopic": "Continuity",
      "difficulty": "Medium",
      "type": "Multiple Choice",
      "year": "2023",
      "reviewed": false,
      "completed": false,
      "options": ["m = 1, n = 0", "m + n = 2", "n = 2m", "m = n = 1"],
      "correctOption": "B",
      "markscheme": "To ensure continuity at \\(x = \\frac{\\pi}{2}\\), the left-hand limit must equal the right-hand limit. Therefore, solving \\(2m \\cdot \\frac{\\pi}{2} + \\sin(\\frac{\\pi}{2}) = n \\cdot \\frac{\\pi}{2} + \\cos(\\frac{\\pi}{2})\\) gives \\(m + n = 2\\).",
      "marks": "5",
      "correctAttempts": "",
      "wrongAttempts": "",
      "averageTimeTaken": "",
      "lastAttempted": ""
  },
  {
      "exam": "CUET",
      "questionId": "2",
      "text": "If \\(2\\sqrt[3]{x} + 4 \\sqrt{9x} = 3\\), then the value of \\(x\\) is",
      "subject": "Mathematics",
      "topic": "Algebra",
      "subtopic": "Equations",
      "difficulty": "Easy",
      "type": "Multiple Choice",
      "year": "2023",
      "reviewed": false,
      "completed": false,
      "options": ["3", "0", "-1", "1"],
      "correctOption": "A",
      "markscheme": "Solving \\(2\\sqrt[3]{x} + 4 \\sqrt{9x} = 3\\) by isolating \\(x\\) gives \\(x = 3\\).",
      "marks": "5",
      "correctAttempts": "",
      "wrongAttempts": "",
      "averageTimeTaken": "",
      "lastAttempted": ""
  },
  {
      "exam": "CUET",
      "questionId": "3",
      "text": "Assertion (A): \\(\\int_{0}^{\\pi/2} \\frac{\\sin x}{\\cos x} dx = \\frac{\\pi}{4}\\) \n Reason (R): \\(\\int_{0}^{\\pi/2} \\sin x \\cos x dx = \\frac{\\pi}{4}\\)",
      "subject": "Mathematics",
      "topic": "Calculus",
      "subtopic": "Integration",
      "difficulty": "Medium",
      "type": "Assertion and Reasoning",
      "year": "2023",
      "reviewed": false,
      "completed": false,
      "options": ["Both A and R are true and R is the correct explanation of A", "Both A and R are true but R is NOT the correct explanation of A", "A is true but R is false", "A is false and R is true"],
      "correctOption": "C",
      "markscheme": "Evaluating the integrals separately shows that \\(\\int_{0}^{\\pi/2} \\frac{\\sin x}{\\cos x} dx = \\frac{\\pi}{4}\\) and \\(\\int_{0}^{\\pi/2} \\sin x \\cos x dx = \\frac{1}{2}\\). Thus, A is true but R is false.",
      "marks": "5",
      "correctAttempts": "",
      "wrongAttempts": "",
      "averageTimeTaken": "",
      "lastAttempted": ""
  },
  {
      "exam": "CUET",
      "questionId": "4",
      "text": "The area of the region bounded by the y-axis, \\(y = \\cos x\\), and \\(y = \\sin x\\) from \\(0 \\leq x \\leq \\frac{\\pi}{2}\\) is",
      "subject": "Mathematics",
      "topic": "Calculus",
      "subtopic": "Definite Integrals",
      "difficulty": "Medium",
      "type": "Multiple Choice",
      "year": "2023",
      "reviewed": false,
      "completed": false,
      "options": ["2 sq. units", "\\(2 + 1\\) sq. units", "\\(2 - 1\\) sq. units", "\\(2\\sqrt{2} - 1\\) sq. units"],
      "correctOption": "C",
      "markscheme": "Integrating the area between the curves \\(y = \\cos x\\) and \\(y = \\sin x\\) from 0 to \\(\\frac{\\pi}{2}\\) gives \\(\\int_{0}^{\\pi/2} (\\cos x - \\sin x) dx = 1 - (-1) = 2\\).",
      "marks": "5",
      "correctAttempts": "",
      "wrongAttempts": "",
      "averageTimeTaken": "",
      "lastAttempted": ""
  }
];


async function main() {
  for (const question of questions) {
    await prisma.question.create({
      data: {
        questionId: question.questionId,
        text: question.text,
        subject: question.subject,
        topic: question.topic,
        subtopic: question.subtopic,
        difficulty: question.difficulty,
        type: question.type,
        year: parseInt(question.year, 10),
        reviewed: question.reviewed,
        completed: question.completed,
        options: question.options,
        correctOption: question.correctOption,
        markscheme: question.markscheme,
        exam: question.exam,
        marks: question.marks,
        correctAttempts: question.correctAttempts,
        wrongAttempts: question.wrongAttempts,
        averageTimeTaken: question.averageTimeTaken,
        lastAttempted: question.lastAttempted ? new Date(question.lastAttempted) : null,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
