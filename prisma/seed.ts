const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const questions = [
  {
    "exam": "CUET",
    "questionId": "46",
    "text": "The accumulation of molecular species at the surface rather than in the bulk of a solid or liquid is termed as adsorption. There are two types of adsorption. In physisorption, attractive forces are mainly Van der Waals forces, while in chemisorption, the adsorbate is held with chemical bonds to the adsorbent. Adsorption increases with an increase in pressure and decreases as temperature is increased.\n\nWhy is adsorption spontaneous?",
    "subject": "Chemistry",
    "topic": "Surface Chemistry",
    "subtopic": "Adsorption",
    "difficulty": "Medium",
    "type": "Multiple Choice",
    "year": "2023",
    "reviewed": false,
    "completed": false,
    "options": [
      "\\( \\Delta \\mathrm{S} \\text{ is negative and is more than } \\Delta \\mathrm{H} \\)",
      "\\( \\Delta \\mathrm{S} \\text{ is positive and is more than } \\Delta \\mathrm{H} \\)",
      "\\( \\Delta \\mathrm{H} \\text{ is negative and is more than } \\mathrm{T} \\Delta \\mathrm{S} \\)",
      "\\( \\Delta \\mathrm{H} - \\mathrm{T} \\Delta \\mathrm{S} \\)"
    ],
    "correctOption": "3",
    "markscheme": "Explanation: For a spontaneous reaction, \\( \\Delta \\mathrm{H} \\) is always negative and it is more than \\( \\mathrm{T} \\Delta \\mathrm{S} \\).",
    "marks": "4",
    "correctAttempts": "",
    "wrongAttempts": "",
    "averageTimeTaken": "",
    "lastAttempted": "",
    "diagramUrl": ""
  },
  {
    "exam": "CUET",
    "questionId": "47",
    "text": "Which of the following is not characteristic of chemical adsorption?",
    "subject": "Chemistry",
    "topic": "Surface Chemistry",
    "subtopic": "Adsorption",
    "difficulty": "Medium",
    "type": "Multiple Choice",
    "year": "2023",
    "reviewed": false,
    "completed": false,
    "options": [
      "It is irreversible",
      "It is highly specific",
      "High temperature is favorable",
      "It results in multi-molecular layers"
    ],
    "correctOption": "4",
    "markscheme": "Explanation: Chemical adsorption does not result in multi-molecular layers, which is a characteristic of physisorption. The other options are properties of chemisorption.",
    "marks": "4",
    "correctAttempts": "",
    "wrongAttempts": "",
    "averageTimeTaken": "",
    "lastAttempted": "",
    "diagramUrl": ""
  },
  {
    "exam": "CUET",
    "questionId": "48",
    "text": "Which of the following is not an application of adsorption?\n\n(1) Control of humidity using silica gel\n\n(2) Separation of noble gases using charcoal\n\n(3) Removal of colouring matter from solutions\n\n(4) Inversion of cane sugar using mineral acids as catalysts",
    "subject": "Chemistry",
    "topic": "Surface Chemistry",
    "subtopic": "Adsorption",
    "difficulty": "Medium",
    "type": "Multiple Choice",
    "year": "2023",
    "reviewed": false,
    "completed": false,
    "options": [
      "Control of humidity using silica gel",
      "Separation of noble gases using charcoal",
      "Removal of colouring matter from solutions",
      "Inversion of cane sugar using mineral acids as catalysts"
    ],
    "correctOption": "4",
    "markscheme": "Explanation: Adsorption is not applicable in inversion of cane sugar using mineral acids as catalysts, while all others are applications of adsorption.",
    "marks": "4",
    "correctAttempts": "",
    "wrongAttempts": "",
    "averageTimeTaken": "",
    "lastAttempted": "",
    "diagramUrl": ""
  },
  {
    "exam": "CUET",
    "questionId": "49",
    "text": "For Freundlich isotherm, graph of \\(\\log (x / \\mathrm{m})\\) is plotted against \\(\\log \\mathrm{P}\\). The slope of the line and its Y-axis intercept are:",
    "subject": "Chemistry",
    "topic": "Surface Chemistry",
    "subtopic": "Adsorption",
    "difficulty": "Medium",
    "type": "Multiple Choice",
    "year": "2023",
    "reviewed": false,
    "completed": false,
    "options": [
      "\\( \\frac{1}{\\mathrm{n}}, \\mathrm{K} \\)",
      "\\( \\frac{1}{\\mathrm{n}}, \\log \\mathrm{K} \\)",
      "\\( \\mathrm{n}, 1 / \\mathrm{K} \\)",
      "\\( \\mathrm{n}, \\frac{1}{\\log \\mathrm{K}} \\)"
    ],
    "correctOption": "2",
    "markscheme": "https://cdn.mathpix.com/cropped/2024_07_20_144493cbe99c8920f625g-08.jpg?height=459&width=716&top_left_y=1477&top_left_x=1129",
    "marks": "4",
    "correctAttempts": "",
    "wrongAttempts": "",
    "averageTimeTaken": "",
    "lastAttempted": "",
    "diagramUrl": ""
  },
  {
    "exam": "CUET",
    "questionId": "50",
    "text": "Critical temperatures of a few gases are given as follows: \\( \\mathrm{SO}_{2} \\) (630 K), \\( \\mathrm{CH}_{4} \\) (190 K), \\( \\mathrm{H}_{2} \\) (33 K). What is the correct order of ease of physisorption of these gases?",
    "subject": "Chemistry",
    "topic": "Surface Chemistry",
    "subtopic": "Adsorption",
    "difficulty": "Medium",
    "type": "Multiple Choice",
    "year": "2023",
    "reviewed": false,
    "completed": false,
    "options": [
      "\\( \\mathrm{CH}_{4} > \\mathrm{H}_{2} > \\mathrm{SO}_{2} \\)",
      "\\( \\mathrm{SO}_{2} > \\mathrm{CH}_{4} > \\mathrm{H}_{2} \\)",
      "\\( \\mathrm{H}_{2} > \\mathrm{CH}_{4} > \\mathrm{SO}_{2} \\)",
      "\\( \\mathrm{H}_{2} > \\mathrm{SO}_{2} > \\mathrm{CH}_{4} \\)"
    ],
    "correctOption": "2",
    "markscheme": "Explanation: Physisorption depends on the critical temperature of gases. Higher critical temperatures correspond to stronger adsorption. \\( \\mathrm{SO}_{2} > \\mathrm{CH}_{4} > \\mathrm{H}_{2} \\).",
    "marks": "4",
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
