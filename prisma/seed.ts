import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// ExamGoal Fetch Function
async function fetchExamGoalQuestions(metaId: string) {
  const url = `https://room.examgoal.com/api/v1/past-question/question/meta/${metaId}?out_of_syllabus=false&fill_other=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch questions for metaId: ${metaId}`);
  const data = await response.json();
  return data.results;
}

// Seed Questions into GoalAspirantsQuestion
async function seedGoalQuestions(metaId: string, exam: string, year: number, subject: string) {
  const questions = await fetchExamGoalQuestions(metaId);

  for (const question of questions) {
    const options = question.options.map((opt: any) => ({
      identifier: opt.identifier,
      content: opt.content,
    }));

    await prisma.goalAspirantsQuestion.create({
      data: {
        questionId: question.question_id,
        exam: exam,
        text: question.content,
        subject: subject,
        topic: question.chapter || question.topicName || null,
        subtopic: question.chapterGroup || null,
        difficulty: question.difficulty || 'Medium',
        type: question.type,
        year: year,
        marks: question.marks ?? null,
        negMarks: question.negMarks ?? null,
        correctOptions: question.correct_options || [],
        explanation: question.explanation || null,
        markscheme: question.markscheme || null,
        subjectGroup: question.subjectGroup || null,
        diagramUrl: question.diagramUrl || null,
        answer: question.answer || null,
        isOutOfSyllabus: question.isOutOfSyllabus || false,
        isBonus: question.isBonus || false,
        options: {
          create: options, // Create related options
        },
      },
    });
  }
}

// Main Script
async function main() {
  const exams = [
    { metaId: 'someMetaId1', exam: 'GATE CSE', year: 2022, subject: 'Computer Science' },
    { metaId: 'someMetaId2', exam: 'GATE ECE', year: 2022, subject: 'Electronics' },
    // Add more exams here...
  ];

  for (const { metaId, exam, year, subject } of exams) {
    console.log(`Seeding questions for ${exam} (${subject})`);
    await seedGoalQuestions(metaId, exam, year, subject);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
