const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const questions = [
    {
        "exam": "CUET",
        "questionId": "1",
        "text": "If \\(f(x)=\\left\\{\\begin{array}{l} m x + 1 \\text{ if } x \\leq \\frac{\\pi}{2} \\\\ \\sin x + n \\text{ if } x > \\frac{\\pi}{2} \\end{array}\\right. \\) is continuous at \\( x = \\frac{\\pi}{2} \\) then",
        "subject": "Mathematics",
        "topic": "Functions",
        "subtopic": "Continuity",
        "difficulty": "Medium",
        "type": "Multiple Choice",
        "year": "2023",
        "reviewed": false,
        "completed": false,
        "options": ["\\(m = 1, n = 0\\)", "\\(m = \\frac{n \\pi}{2} + 1\\)", "\\(n = \\frac{m \\pi}{2}\\)", "\\(m = n = \\frac{\\pi}{2}\\)"],
        "correctOption": "A",
        "markscheme": "For the function to be continuous at \\( x = \\frac{\\pi}{2} \\), both pieces of the function must equal each other at this point, giving \\( m = 1 \\) and \\( n = 0 \\).",
        "marks": "5",
        "correctAttempts": "",
        "wrongAttempts": "",
        "averageTimeTaken": "",
        "lastAttempted": "",
        "diagramUrl": ""
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
        diagramUrl: question.diagramUrl,  // Add this line
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
