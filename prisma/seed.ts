/**
 * seed.ts (CommonJS + TypeScript)
 *
 * Alternate approach:
 *  - NO prisma.$transaction() calls
 *  - We simply upsert the exam, then createMany questions in a for..of loop
 *  - If an error occurs, we log it and move on
 * 
 * Pros:
 *  - Avoid "Transaction already closed" errors entirely
 *  - Simplest control flow
 * Cons:
 *  - Partial data if errors happen mid-seed (no rollback)
 */

///////////////////////////////
// CommonJS + TS imports
///////////////////////////////
const fs = require('fs');
const path = require('path');

// Prisma Client + namespace + any enums
import { PrismaClient, Prisma as PrismaNS, QuestionStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

///////////////////////////////
// Helpers
///////////////////////////////
function toNullableJson(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return PrismaNS.DbNull; // store as actual SQL NULL
    // Or use PrismaNS.JsonNull if you want JSON literal null
  }
  return value as Prisma.InputJsonValue;
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return String(value);
}

///////////////////////////////
// Prisma
///////////////////////////////
const prisma = new PrismaClient();

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

type QuestionItem = {
  question_id: string;
  marks?: number | string;
  negMarks?: number | string;
  correctAttempts?: number | string;
  wrongAttempts?: number | string;
  content?: Record<string, any>;
  linkedResources?: Record<string, any>;
  question?: {
    en?: {
      content?: string | null;
      correct_options?: string[];
      explanation?: string | null;
      // ...
    };
  };
  // ...plus other optional fields
};

type QuestionData = {
  results: {
    _id: string;
    questions: QuestionItem[];
  }[];
};

type QuestionCreateInput = {
  questionId: string;
  examId: number;
  text: string;
  status: QuestionStatus;
  marks?: number | null;
  negMarks?: number | null;
  correctAttempts?: string | null;
  wrongAttempts?: string | null;
  content?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  explanation?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  linkedResources?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  // etc...
};

///////////////////////////////
// Main Logic (no transactions)
///////////////////////////////
async function main() {
  const metaFilePath = './!metaid/jee_jee-main.json';
  const questionFolder = './past-papers/jee_jee-main';

  console.log('Reading meta file:', metaFilePath);
  console.log('Reading question files from:', questionFolder);

  // 1) Parse meta file
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

  // 2) Build metaMap
  const metaMap: Record<string, MetaData> = {};
  for (const m of metaArray) {
    if (!m.metaId) {
      console.warn('Skipping meta with no metaId:', m);
      continue;
    }
    metaMap[m.metaId] = m;
  }

  // 3) Read question folder
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

  // parse each question file
  for (const qFile of questionFiles) {
    const metaId = qFile.replace('.json', '');
    if (!metaMap[metaId]) {
      console.warn(`No meta found for question file: ${qFile}`);
      continue;
    }

    const questionFilePath = path.join(qFolderAbsolute, qFile);
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

  // 4) For each metaId, Upsert exam, then createMany questions (no transactions)
  for (const [metaId, metaObj] of Object.entries(metaMap)) {
    const matchedQuestions = questionMap[metaId];
    if (!matchedQuestions || matchedQuestions.length === 0) {
      console.warn(`No question file matched metaId: ${metaId}`);
      continue;
    }

    console.log(`\n=== Processing metaId: ${metaId} => ${metaObj.title} ===`);

    try {
      // (a) Upsert exam - no transaction
      const exam = await prisma.exam.upsert({
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
          languages: metaObj.languages,
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
      console.log(`Upserted exam => ${exam.title} (id: ${exam.id})`);

      // (b) Filter valid questions
      const validQuestions = matchedQuestions.filter(
        (q) => q.question_id && q.question_id.trim() !== ''
      );
      if (!validQuestions.length) {
        console.warn(`No valid questions for metaId: ${metaId}`);
        continue;
      }

      // (c) Build createMany data
      const toCreate: QuestionCreateInput[] = validQuestions.map((q) => {
        const questionId = q.question_id;
        const enContent = q.question?.en?.content || 'No text available';

        // parse numeric => float
        const marks = q.marks != null ? parseFloat(String(q.marks)) : null;
        const negMarks = q.negMarks != null ? parseFloat(String(q.negMarks)) : null;

        // parse attempts => string
        const correctAttempts = toStringOrNull(q.correctAttempts);
        const wrongAttempts = toStringOrNull(q.wrongAttempts);

        // build explanation
        let explanationObj: Record<string, any> | null = null;
        if (q.question?.en?.explanation && q.question.en.explanation.trim()) {
          explanationObj = { en: q.question.en.explanation };
        }

        // JSON fields
        const contentValue = toNullableJson(q.content);
        const explanationValue = toNullableJson(explanationObj);
        const linkedResourcesValue = toNullableJson(q.linkedResources);

        return {
          questionId,
          examId: exam.id,
          text: enContent,
          status: QuestionStatus.ACTIVE, // use enum

          marks,
          negMarks,
          correctAttempts,
          wrongAttempts,
          content: contentValue,
          explanation: explanationValue,
          linkedResources: linkedResourcesValue,
        };
      });

      // (d) createMany questions
      const result = await prisma.question.createMany({
        data: toCreate,
      });
      console.log(`Inserted ${result.count} questions for metaId: ${metaId}`);
    } catch (err) {
      // If something fails, partial data won't roll back (no transaction)
      console.error(`Seeding failed for metaId: ${metaId}`, err);
    }
  }

  console.log('\nAll done (no transactions used).');
}

// Run script
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error in main:', err);
    process.exit(1);
  });
