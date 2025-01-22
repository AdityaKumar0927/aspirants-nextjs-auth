/**
 * seed.ts (CommonJS + TypeScript)
 * 
 * This script:
 * 1. Reads your meta file (!metaid/jee_jee-main.json).
 * 2. Reads question JSON files from /past-papers/jee_jee-main, each named by metaId.
 * 3. Upserts the exam in a quick non-transaction.
 * 4. Splits questions into chunks (CHUNK_SIZE = 100).
 * 5. For each chunk, runs a short transaction => createMany(questions).
 *    This prevents "Transaction already closed" due to lengthy single transactions.
 */

///////////////////////////////
// CommonJS requires + TS imports
///////////////////////////////
const fs = require("fs");
const path = require("path");
import type { Prisma } from "@prisma/client";
const { PrismaClient, Prisma: PrismaNS, QuestionStatus } = require("@prisma/client");

///////////////////////////////
// Logger
///////////////////////////////
function logInfo(msg: string) {
  console.log(`[INFO ] ${new Date().toISOString()} - ${msg}`);
}
function logWarn(msg: string) {
  console.warn(`[WARN ] ${new Date().toISOString()} - ${msg}`);
}
function logError(msg: string) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
}

///////////////////////////////
// Chunk Helper
///////////////////////////////
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

///////////////////////////////
// Conversion Helpers
///////////////////////////////
function toNullableJson(value: unknown) {
  if (value === null || value === undefined) {
    return PrismaNS.DbNull;
  }
  return value as any; // or as Prisma.InputJsonValue
}

function toStringOrNull(value: any): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function toFloatOrNull(value: any): number | null {
  if (value == null || value === "") return null;
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function toIntOrNull(value: any): number | null {
  if (value == null || value === "") return null;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

///////////////////////////////
// Prisma
///////////////////////////////
const prisma = new PrismaClient();

///////////////////////////////
// Types for your data
///////////////////////////////
interface ExamMeta {
  metaId: string;
  country?: string;
  exam?: string;
  examGroup?: string;
  key: string;
  date?: string;
  description?: string | null;
  isOnline?: boolean;
  isMemoryBased?: boolean;
  languages?: string[];
  title: string;
  year?: number;
  pyq?: {
    count: {
      out_of_syllabus: number;
      total: number;
      private: number;
      public: number;
    };
  };
}

interface QuestionFile {
  statusCode?: number;
  results: {
    _id?: string;
    questions: QuestionJson[];
  }[];
}

interface QuestionJson {
  question_id: string;
  examGroup?: string | null;
  exam?: string | null;
  country?: string | null;
  subjectGroup?: string | null;
  subject?: string | null;
  chapterGroup?: string | null;
  chapter?: string | null;
  year?: number | null;
  paperTitle?: string | null;
  timeAllotted?: number | null;
  marks?: number | null;
  negMarks?: number | null;
  languages?: string[];
  difficulty?: string | null;
  topicName?: string | null;
  type?: string | null;
  examDate?: string | null;
  question?: any; // deeper nested fields (question.en, etc.)
  updated_time?: number | null;
  permalink?: string | null;
  paperId?: string | null;
  topic?: string | null;
  isOutOfSyllabus?: boolean | null;
  isBonus?: boolean | null;
  yearKey?: string | null;
}

///////////////////////////////
// Main
///////////////////////////////
async function main() {
  const metaFilePath = "./!metaid/jee_jee-main.json";
  const questionFolder = "./past-papers/jee_jee-main";

  logInfo(`Reading meta file: ${metaFilePath}`);
  logInfo(`Reading question files from: ${questionFolder}`);

  // 1) Parse meta file
  let metaArray: ExamMeta[];
  try {
    const rawMeta = fs.readFileSync(metaFilePath, "utf-8");
    metaArray = JSON.parse(rawMeta);
    if (!Array.isArray(metaArray)) {
      throw new Error("Meta file is not an array of objects");
    }
  } catch (err) {
    logError(`Failed to parse meta file: ${err}`);
    return;
  }

  // 2) Build metaMap (metaId => ExamMeta)
  const metaMap: Record<string, ExamMeta> = {};
  for (const m of metaArray) {
    if (!m.metaId) {
      logWarn(`Skipping meta with no metaId: ${JSON.stringify(m)}`);
      continue;
    }
    metaMap[m.metaId] = m;
  }

  // 3) Read question folder
  const qFolderAbsolute = path.resolve(questionFolder);
  if (!fs.existsSync(qFolderAbsolute)) {
    logError(`Question folder does not exist: ${qFolderAbsolute}`);
    return;
  }

  const questionFiles = fs
    .readdirSync(qFolderAbsolute)
    .filter((f: string) => f.endsWith(".json"));

  // questionMap: metaId => array of question objects
  const questionMap: Record<string, QuestionJson[]> = {};

  // 4) Gather questions from each file
  for (const qFile of questionFiles) {
    const metaId = qFile.replace(".json", "");
    if (!metaMap[metaId]) {
      logWarn(`No meta found for question file: ${qFile}`);
      continue;
    }

    const questionFilePath = path.join(qFolderAbsolute, qFile);
    let raw: any;
    try {
      raw = JSON.parse(fs.readFileSync(questionFilePath, "utf-8"));
    } catch (err) {
      logError(`Failed to parse question file: ${qFile}, err: ${err}`);
      continue;
    }

    if (!raw || !raw.results || !Array.isArray(raw.results)) {
      logWarn(`No valid "results" array in file: ${qFile}`);
      continue;
    }

    let allQuestions: QuestionJson[] = [];
    for (const block of raw.results) {
      if (block.questions && Array.isArray(block.questions)) {
        allQuestions = allQuestions.concat(block.questions);
      }
    }
    if (!allQuestions.length) {
      logWarn(`Found 0 questions after parsing results[].questions in file: ${qFile}`);
      continue;
    }

    questionMap[metaId] = allQuestions;
  }

  // 5) For each metaId, upsert exam outside big transaction, then chunk question inserts
  for (const [metaId, metaObj] of Object.entries(metaMap)) {
    const matchedQuestions = questionMap[metaId];
    if (!matchedQuestions || matchedQuestions.length === 0) {
      logWarn(`No question file matched metaId: ${metaId}`);
      continue;
    }

    logInfo(`\n=== Processing metaId: ${metaId} => ${metaObj.title} ===`);

    try {
      // (A) Upsert exam outside large transaction
      const exam = await prisma.exam.upsert({
        where: { key: metaObj.key },
        update: {},
        create: {
          examGroup: metaObj.examGroup || null,
          country: metaObj.country || null,
          exam: metaObj.exam || null,
          key: metaObj.key,
          date: toDateOrNull(metaObj.date),
          description: metaObj.description ?? null,
          isMemoryBased: metaObj.isMemoryBased ?? false,
          isOnline: metaObj.isOnline ?? false,
          languages: metaObj.languages || [],
          title: metaObj.title,
          year: metaObj.year ?? null,
          pyq: metaObj.pyq
            ? {
                create: {
                  out_of_syllabus: metaObj.pyq.count.out_of_syllabus,
                  total: metaObj.pyq.count.total,
                  private: metaObj.pyq.count.private,
                  public: metaObj.pyq.count.public,
                },
              }
            : undefined,
        },
      });
      logInfo(`Upserted exam => ${exam.title} (id: ${exam.id})`);

      // (B) Build question data
      const validQuestions = matchedQuestions.filter(
        (q) => q.question_id && q.question_id.trim() !== ""
      );
      if (!validQuestions.length) {
        logWarn(`No valid 'question_id' found for metaId: ${metaId}`);
        continue;
      }

      const questionCreateData = validQuestions.map((q) => {
        const questionId = q.question_id.trim();
        const textContent =
          q.question?.en?.content?.trim() ||
          q.question?.content?.trim() ||
          "No text available";

        let optionsArray: string[] = [];
        if (q.question?.en?.options && Array.isArray(q.question.en.options)) {
          optionsArray = q.question.en.options.map(String);
        }

        let correctOption: string | null = null;
        if (
          q.question?.en?.correct_options &&
          Array.isArray(q.question.en.correct_options) &&
          q.question.en.correct_options.length > 0
        ) {
          correctOption = q.question.en.correct_options[0];
        } else if (q.question?.en?.answer) {
          correctOption = String(q.question.en.answer);
        }

        return {
          questionId,
          examId: exam.id,

          examGroup: q.examGroup || null,
          country: q.country || null,
          exam: q.exam || null,
          subjectGroup: q.subjectGroup || null,
          subject: q.subject || null,
          chapterGroup: q.chapterGroup || null,
          chapter: q.chapter || null,
          topicName: q.topicName || null,
          topic: q.topic || null,
          difficulty: q.difficulty || null,
          type: q.type || null,

          year: q.year ?? null,
          paperTitle: q.paperTitle ?? null,
          timeAllotted: q.timeAllotted ?? null,
          marks: toFloatOrNull(q.marks),
          negMarks: toFloatOrNull(q.negMarks),
          updatedTime: toIntOrNull(q.updated_time),
          examDate: toDateOrNull(q.examDate),
          isOutOfSyllabus: q.isOutOfSyllabus ?? null,
          isBonus: q.isBonus ?? null,
          yearKey: q.yearKey || null,
          permalink: q.permalink || null,
          languages: q.languages || [],

          // required text
          text: textContent,
          options: optionsArray,
          correctOption,
          content: toNullableJson(q.question),
          status: QuestionStatus.ACTIVE,
        };
      });

      // (C) Chunk inserts in smaller transactions
      const CHUNK_SIZE = 100; // pick a chunk size that finishes quickly
      const chunks = chunkArray(questionCreateData, CHUNK_SIZE);
      let totalCreated = 0;

      for (const chunk of chunks) {
        // short transaction for each chunk
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const res = await tx.question.createMany({
            data: chunk,
            skipDuplicates: true,
          });
          totalCreated += res.count;
        });
        // each chunk commits or rolls back here
      }

      logInfo(`Inserted ${totalCreated} questions for exam: ${exam.title}`);
    } catch (err) {
      // If any chunk fails, that chunk is rolled back,
      // but prior chunks remain committed.
      logError(`Error seeding data for metaId: ${metaId}: ${err}`);
    }
  }

  // All meta files processed
  logInfo("All done. Closing Prisma.");
  await prisma.$disconnect();
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    logError(`Seeding script crashed unexpectedly: ${err}`);
    process.exit(1);
  });
