/**
 * seed.ts (CommonJS + TypeScript)
 * 
 * 1) Parses a meta file in `!metaid/`.
 * 2) Scans a subfolder in `past-papers/` for question files named <metaId>.json.
 * 3) For each matching pair, does one Prisma transaction:
 *    - Upsert the exam
 *    - createMany questions
 *
 * Key Fix: Converts `null` => Prisma.DbNull or Prisma.JsonNull for JSON fields.
 */

///////////////////////////////
// CommonJS + TS imports
///////////////////////////////
const fs = require('fs');
const path = require('path');

// Import Prisma types + client
import type { Prisma } from '@prisma/client';
const { PrismaClient, Prisma: PrismaNamespace } = require('@prisma/client');

///////////////////////////////
// Helper for JSON fields
///////////////////////////////
/**
 * Converts `object | null | undefined` to a valid JSON input for Prisma:
 * - If `value` is an object, cast to Prisma.JsonValue.
 * - Otherwise, return Prisma.DbNull (to store actual SQL null in DB),
 *   or Prisma.JsonNull (to store a JSON literal `null`).
 */
function toNullableJson(value: object | null | undefined): Prisma.JsonValue | null {
  // Decide how you want to store "null" in the DB:
  //   1) If you want an actual SQL NULL, use PrismaNamespace.DbNull
  //   2) If you want to store JSON literal null, use PrismaNamespace.JsonNull

  return value ? (value as Prisma.JsonValue) : PrismaNamespace.DbNull;
}

///////////////////////////////
// Types
///////////////////////////////
type MetaData = {
  examGroup: string;
  country: string;
  exam: string;
  key: string;
  date: string;
  description?: string | null;
  isMemoryBased?: boolean;
  isOnline?: boolean;
  languages: string[];
  title: string;
  year: number;
  metaId: string;
  pyq: {
    count: {
      out_of_syllabus: number;
      total: number;
      private: number;
      public: number;
    };
  };
};

type QuestionOption = {
  identifier: string;
  content: string;
};

type QuestionItem = {
  question_id: string;
  country?: string;
  examGroup?: string;
  exam?: string;
  subject?: string;
  year?: number;
  paperTitle?: string;
  timeAllotted?: number;
  marks?: number;
  negMarks?: number;
  languages?: string[];
  difficulty?: string;
  type?: string;
  topic?: string;
  topicName?: string;
  examDate?: string;
  content?: Record<string, any>;
  permalink?: string;
  paperId?: string;
  isOutOfSyllabus?: boolean;
  isBonus?: boolean;
  yearKey?: string;
  updated_time?: number;
  averageTimeTaken?: string | number;
  diagramUrl?: string;
  subjectGroup?: string;
  chapterGroup?: string;
  chapter?: string;
  question?: {
    en?: {
      content?: string | null;
      options?: QuestionOption[];
      correct_options?: string[];
      explanation?: string | null;
    };
    hi?: Record<string, any>;
  };
};

type QuestionData = {
  results: {
    _id: string;
    questions: QuestionItem[];
  }[];
};

/**
 * The final shape we pass to createMany().
 * Note the JSON fields (content, explanation) must be `Prisma.JsonValue | null`.
 */
type QuestionCreateInput = {
  questionId: string;
  examId: number;
  examGroup?: string | null;
  country?: string | null;
  exam?: string | null;
  key?: string | null;
  date?: Date | null;
  description?: string | null;
  isMemoryBased?: boolean;
  isOnline?: boolean;
  languages?: string[];
  title?: string | null;
  year?: number | null;
  pyqOutOfSyllabus?: number | null;
  pyqTotal?: number | null;
  pyqPrivate?: number | null;
  pyqPublic?: number | null;
  subjectGroup?: string | null;
  chapterGroup?: string | null;
  chapter?: string | null;
  topicName?: string | null;
  examDate?: Date | null;
  content?: Prisma.JsonValue | null;     // JSON field
  permalink?: string | null;
  paperId?: string | null;
  isOutOfSyllabus?: boolean;
  isBonus?: boolean;
  text: string;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  difficulty?: string | null;
  type?: string | null;
  marks?: number | null;
  negMarks?: number | null;
  options: string[];
  correctOption?: string | null;
  markscheme?: string | null;
  correctAttempts?: number | null;
  wrongAttempts?: number | null;
  averageTimeTaken?: string | null;
  lastAttempted?: Date | null;
  diagramUrl?: string | null;
  customTag?: string | null;
  explanation?: Prisma.JsonValue | null; // JSON field
  reviewed?: boolean | null;
  completed?: boolean | null;
  paperTitle?: string | null;
  timeAllotted?: number | null;
  updatedTime?: number | null;
  updatedBy?: string | null;
  source?: string | null;
  peerSolvedPercentage?: string | null;
  linkedResources?: Prisma.JsonValue | null;
  commonMistakes?: Prisma.JsonValue | null;
  discussionLink?: string | null;
  parentQuestionId?: string | null;
  difficultyRating?: string | null;
  yearKey?: string | null;
  status: string;
};

///////////////////////////////
// Prisma Client
///////////////////////////////
const prisma = new PrismaClient();

///////////////////////////////
// Main Logic
///////////////////////////////
async function main() {
  // 1) Example: single meta file + subfolder
  const metaFilePath = './!metaid/jee_jee-main.json';
  const questionFolder = './past-papers/jee_jee-main';

  console.log('Reading meta file:', metaFilePath);
  console.log('Reading question files from:', questionFolder);

  // 2) Parse meta file
  let metaArray: MetaData[];
  try {
    metaArray = JSON.parse(fs.readFileSync(metaFilePath, 'utf-8'));
    if (!Array.isArray(metaArray)) {
      throw new Error('Meta file is not an array of objects');
    }
  } catch (err) {
    console.error('Failed to parse meta file:', err);
    return;
  }

  // 3) Build metaMap: metaId => MetaData
  const metaMap: Record<string, MetaData> = {};
  for (const m of metaArray) {
    if (!m.metaId) {
      console.warn('Skipping meta with no metaId:', m);
      continue;
    }
    metaMap[m.metaId] = m;
  }

  // 4) Scan questionFolder for .json
  const qFolderAbsolute = path.resolve(questionFolder);
  if (!fs.existsSync(qFolderAbsolute)) {
    console.error('Question folder does not exist:', qFolderAbsolute);
    return;
  }

  const questionFiles = fs
    .readdirSync(qFolderAbsolute)
    .filter((f: string) => f.endsWith('.json'));

  // questionMap: metaId => QuestionItem[]
  const questionMap: Record<string, QuestionItem[]> = {};

  // Parse each question file
  for (const qFile of questionFiles) {
    const metaId = qFile.replace('.json', '');
    const questionFilePath = path.join(qFolderAbsolute, qFile);

    if (!metaMap[metaId]) {
      console.warn(`No meta found for question file: ${qFile}`);
      continue;
    }

    let questionData: QuestionData;
    try {
      questionData = JSON.parse(fs.readFileSync(questionFilePath, 'utf-8'));
    } catch (err) {
      console.error(`Failed to parse question file: ${qFile}`, err);
      continue;
    }

    let items: QuestionItem[] = [];
    for (const block of questionData.results) {
      items = items.concat(block.questions);
    }
    questionMap[metaId] = (questionMap[metaId] || []).concat(items);
  }

  // 5) For each metaId, run a single transaction
  for (const [metaId, metaObj] of Object.entries(metaMap)) {
    const matchedQuestions = questionMap[metaId];
    if (!matchedQuestions || matchedQuestions.length === 0) {
      console.warn(`No question file matched metaId: ${metaId}`);
      continue;
    }

    console.log(`\n=== Processing metaId: ${metaId} => ${metaObj.title} ===`);

    try {
      // One transaction for exam + questions
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Upsert exam
        const exam = await tx.exam.upsert({
          where: { key: metaObj.key },
          update: {},
          create: {
            examGroup: metaObj.examGroup,
            country: metaObj.country,
            exam: metaObj.exam,
            key: metaObj.key,
            date: new Date(metaObj.date),
            description: metaObj.description || null,
            isMemoryBased: metaObj.isMemoryBased || false,
            isOnline: metaObj.isOnline || true,
            languages: metaObj.languages || [],
            title: metaObj.title,
            year: metaObj.year,
            pyq: {
              create: {
                out_of_syllabus: metaObj.pyq.count.out_of_syllabus,
                total: metaObj.pyq.count.total,
                private: metaObj.pyq.count.private,
                public: metaObj.pyq.count.public,
              },
            },
          },
        });

        console.log(`Upserted exam: ${exam.title} (id: ${exam.id})`);

        // Filter out invalid items
        const validQuestions = matchedQuestions.filter(
          (q) => q.question_id && q.question_id.trim() !== ''
        );
        if (validQuestions.length === 0) {
          console.warn(`No valid questions found for metaId: ${metaId}`);
          return;
        }

        // Build data for createMany
        const toCreate: QuestionCreateInput[] = validQuestions.map((q) => {
          const questionId = q.question_id;
          const enContent = q.question?.en?.content || 'No text available';
          const text = enContent || 'No text available';

          const marks = q.marks != null ? parseFloat(String(q.marks)) : null;
          const negMarks = q.negMarks != null ? parseFloat(String(q.negMarks)) : null;

          let options: string[] = [];
          if (q.question?.en?.options) {
            options = q.question.en.options.map((opt) => opt.content || '');
          }

          let correctOption: string | null = null;
          if (q.question?.en?.correct_options?.length) {
            correctOption = q.question.en.correct_options[0];
          }

          // Explanation
          let explanation: object | null = null;
          if (q.question?.en?.explanation && q.question.en.explanation.trim()) {
            explanation = { en: q.question.en.explanation };
          }

          // averageTimeTaken
          let averageTimeTaken: string | null = null;
          if (q.averageTimeTaken != null) {
            averageTimeTaken = String(q.averageTimeTaken);
          }

          // examDate
          let examDate: Date | null = null;
          if (q.examDate) {
            examDate = new Date(q.examDate);
          }

          // content
          const contentValue = toNullableJson(q.content);
          const explanationValue = toNullableJson(explanation);

          // languages
          const languages =
            q.languages && q.languages.length > 0
              ? q.languages
              : metaObj.languages;

          return {
            questionId,
            examId: exam.id,
            examGroup: q.examGroup || metaObj.examGroup || null,
            country: q.country || metaObj.country || null,
            exam: q.exam || metaObj.exam || null,
            key: q.paperId || null,
            date: null,
            description: null,
            isMemoryBased: metaObj.isMemoryBased || false,
            isOnline: metaObj.isOnline || true,
            languages,
            title: q.paperTitle || metaObj.title,
            year: q.year || metaObj.year || null,
            pyqOutOfSyllabus: null,
            pyqTotal: null,
            pyqPrivate: null,
            pyqPublic: null,

            subjectGroup: q.subjectGroup || null,
            chapterGroup: q.chapterGroup || null,
            chapter: q.chapter || null,
            topicName: q.topicName || null,
            examDate,
            content: contentValue,         // JSON field
            permalink: q.permalink || null,
            paperId: q.paperId || null,
            isOutOfSyllabus: q.isOutOfSyllabus || false,
            isBonus: q.isBonus || false,

            text,
            subject: q.subject || null,
            topic: q.topic || q.topicName || null,
            subtopic: null,
            difficulty: q.difficulty || null,
            type: q.type || 'mcq',
            marks,
            negMarks,
            options,
            correctOption,
            markscheme: null,
            correctAttempts: null,
            wrongAttempts: null,
            averageTimeTaken,
            lastAttempted: q.updated_time
              ? new Date(q.updated_time * 1000)
              : null,
            diagramUrl: q.diagramUrl || null,
            customTag: null,
            explanation: explanationValue, // JSON field
            reviewed: null,
            completed: null,

            paperTitle: q.paperTitle || metaObj.title,
            timeAllotted: q.timeAllotted || null,
            updatedTime: q.updated_time || null,
            updatedBy: null,
            source: null,
            peerSolvedPercentage: null,
            linkedResources: null, // or toNullableJson(...) if needed
            commonMistakes: null,  // or toNullableJson(...) if needed
            discussionLink: null,
            parentQuestionId: null,
            difficultyRating: null,
            yearKey: q.yearKey || null,
            status: 'ACTIVE',
          };
        });

        // createMany
        const result = await tx.question.createMany({
          data: toCreate,
        });
        console.log(`Inserted ${result.count} questions for metaId: ${metaId}`);
      });
    } catch (err) {
      console.error(`Transaction failed for metaId: ${metaId}`, err);
    }
  }

  console.log('\nAll done!');
}

// Run script
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error in main:', err);
    process.exit(1);
  });
