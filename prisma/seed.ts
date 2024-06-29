const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const questions = [
  {
    questionId: "501411",
    text: "Ram and Balram are partners in a firm sharing profit and losses...",
    subject: "Accountancy/Book Keeping",
    difficulty: "Medium",
    type: "Multiple Choice",
    year: "2022",
    reviewed: false,
    completed: false,
    options: ["₹ 1,06,667", "₹ 60,000", "₹ 1,00,000", "₹ 26,667"],
    correctOption: "B",
    markscheme: "Calculate the overvaluation percentage: ..."
  },
  // Add other questions here...
];

async function main() {
  for (const question of questions) {
    await prisma.question.create({
      data: {
        questionId: question.questionId,
        text: question.text,
        subject: question.subject,
        difficulty: question.difficulty,
        type: question.type,
        year: parseInt(question.year, 10),
        reviewed: question.reviewed,
        completed: question.completed,
        options: question.options,
        correctOption: question.correctOption,
        markscheme: question.markscheme,
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
