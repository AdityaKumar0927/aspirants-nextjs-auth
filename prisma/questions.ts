import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Interfaces for type safety
interface ExamDetails {
  group: string;
  exam: string;
}

interface PaperFromExamGoal {
  metaId: string;
  year: number;
  subject: string;
  topicName?: string;
  chapter?: string;
  chapterGroup?: string;
  marks?: number;
  negMarks?: number;
  content?: string;
  explanation?: string;
  markscheme?: string;
  diagramUrl?: string;
  difficulty?: string;
  type?: string;
  subjectGroup?: string;
  title?: string;
}

interface QuestionOptionFromExamGoal {
  identifier: string;
  content: string;
}

interface QuestionFromExamGoal {
  question_id: string;
  marks?: number;
  negMarks?: number;
  subjectGroup?: string;
  subject: string;
  chapterGroup?: string;
  chapter?: string;
  difficulty?: string;
  topicName?: string;
  type?: string;
  examDate?: string;
  topic?: string;
  isOutOfSyllabus?: boolean;
  isBonus?: boolean;
  content: string;
  options: QuestionOptionFromExamGoal[];
  correct_options?: string[];
  answer?: string;
  explanation?: string;
  markscheme?: string;
  correctAttempts?: string;
  wrongAttempts?: string;
  averageTimeTaken?: string;
  diagramUrl?: string;
}

// Exams list
const examsList: ExamDetails[] = [
  { group: "GATE", exam: "CSE" },
  { group: "GATE", exam: "ECE" },
  { group: "GATE", exam: "EE" },
  { group: "GATE", exam: "ME" },
  { group: "GATE", exam: "CE" },
  { group: "GATE", exam: "PI" },
  { group: "GATE", exam: "IN" },
  { group: "Civil Services", exam: "UPSC Civil Service" },
  { group: "Defence", exam: "NDA" },
  { group: "Staff Selection Commission", exam: "SSC CGL Tier I" },
  { group: "CBSE", exam: "Grade 12" },
];

// Fetch papers from the API
async function get_papers(group: string, exam: string): Promise<PaperFromExamGoal[]> {
  const url = `https://room.examgoal.com/api/v1/metadata/papers?country=in&examGroup=${encodeURIComponent(group)}&exam=${encodeURIComponent(exam)}&from=pq`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch papers for ${exam} (${group}): ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error(`Error fetching papers for ${exam} (${group}):`, err);
    return [];
  }
}

// Get the last question ID from the database
async function getLastQuestionId(): Promise<number> {
  const lastQuestion = await prisma.question.findFirst({
    orderBy: { questionId: 'desc' },
    select: { questionId: true },
  });

  return lastQuestion ? parseInt(lastQuestion.questionId, 10) : 1069;
}

// Store papers in the database and file system
async function store_papers(group: string, exam: string, papers: PaperFromExamGoal[], startingQuestionId: number): Promise<number> {
  let currentQuestionId = startingQuestionId;

  for (const paper of papers) {
    const filename = `./papers/${paper.year}_${paper.subject}_${exam}.json`;

    try {
      await fs.writeFile(filename, JSON.stringify(paper, null, 2)); // Save JSON file

      currentQuestionId++;

      await prisma.question.create({
        data: {
          exam: exam,
          questionId: currentQuestionId.toString(),
          text: paper.content || paper.title || 'No content available',
          subject: paper.subject || 'Unknown Subject',
          topic: paper.topicName || paper.chapter || '',
          subtopic: paper.chapterGroup || '',
          chapter: paper.chapter || '',
          difficulty: paper.difficulty || 'Medium',
          year: paper.year,
          reviewed: false,
          completed: false,
          marks: paper.marks ?? 4,
          negMarks: paper.negMarks ?? 1,
          subjectGroup: paper.subjectGroup || null,
          explanation: paper.explanation || '',
          markscheme: paper.markscheme || '',
          correctOptions: [],
          diagramUrl: paper.diagramUrl || '',
        },
      });

      console.log(`Paper saved: ${filename}`);
    } catch (error) {
      console.error(`Error storing paper: ${filename}`, error);
    }
  }

  return currentQuestionId;
}

// Store questions in the database
async function store_questions(group: string, exam: string, papers: PaperFromExamGoal[], startingQuestionId: number): Promise<number> {
  let currentQuestionId = startingQuestionId;

  for (const paper of papers) {
    try {
      const response = await fetch(`https://room.examgoal.com/api/v1/past-question/question/meta/${paper.metaId}?out_of_syllabus=false&fill_other=false`);

      if (!response.ok) {
        console.error(`Failed to fetch questions for paper ${paper.metaId}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const questions: QuestionFromExamGoal[] = data.results || [];

      for (const question of questions) {
        currentQuestionId++;

        await prisma.question.create({
          data: {
            exam: exam,
            questionId: currentQuestionId.toString(),
            text: question.content,
            subject: question.subject || 'Unknown Subject',
            topic: question.topicName || question.topic || question.chapter || '',
            subtopic: question.chapterGroup || '',
            difficulty: question.difficulty || 'Medium',
            type: question.type || 'mcq',
            year: paper.year,
            options: {
              create: question.options.map(opt => ({
                identifier: opt.identifier,
                content: opt.content,
              })),
            },
            correctOptions: question.correct_options || [],
          },
        });
      }

      console.log(`Questions saved for paper: ${paper.metaId}`);
    } catch (error) {
      console.error(`Error storing questions for paper: ${paper.metaId}`, error);
    }
  }

  return currentQuestionId;
}

// Main function
async function run() {
  let currentQuestionId = await getLastQuestionId();

  for (const examDetails of examsList) {
    const papers = await get_papers(examDetails.group, examDetails.exam);
    if (papers.length === 0) continue;

    currentQuestionId = await store_papers(examDetails.group, examDetails.exam, papers, currentQuestionId);
    currentQuestionId = await store_questions(examDetails.group, examDetails.exam, papers, currentQuestionId);

    console.log(`Processed ${examDetails.exam} successfully!`);
  }

  console.log("Processing complete!");
}

run().catch(e => console.error("Unexpected error:", e)).finally(() => prisma.$disconnect());
