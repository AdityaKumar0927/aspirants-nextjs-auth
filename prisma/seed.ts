/**
 * seed.ts (CommonJS + TypeScript)
 *
 * - Reads an array of exam metadata from:  ./!metaid/jee_jee-main.json
 * - Reads question JSON files from:        ./past-papers/jee_jee-main
 *   Each question file is named by the metaId (e.g., <metaId>.json).
 * - Upserts each Exam outside any transaction (just a normal upsert).
 * - Inserts all questions in chunks (createMany, skipDuplicates: true).
 * - No large transactions => avoids "Transaction already closed" timeouts.
 * - Includes all recognized fields from your question JSON to store them
 *   in the Prisma "Question" table, plus the entire question object in `content`.
 */

///////////////////////////////
// CommonJS + TS imports
///////////////////////////////
const fs = require("fs");
const path = require("path");
import type { Prisma } from "@prisma/client";
import {
  PrismaClient,
  Prisma as PrismaNS,
  QuestionStatus,
} from "@prisma/client";

///////////////////////////////
// Logger helpers
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
// Utility: chunk an array
///////////////////////////////
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

///////////////////////////////
// Convert Helpers
///////////////////////////////

function toNullableJson(value: unknown): PrismaNS.JsonValue | PrismaNS.DbNull {
  if (value === null || value === undefined) {
    return PrismaNS.DbNull;
  }
  return value as PrismaNS.JsonValue;
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
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
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
  // Possibly more fields...
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
  question?: any; // We'll store entire 'question' block in 'content' field
  updated_time?: number | null;
  permalink?: string | null;
  paperId?: string | null;
  topic?: string | null;
  isOutOfSyllabus?: boolean | null;
  isBonus?: boolean | null;
  yearKey?: string | null;
  // possibly more fields
}

///////////////////////////////
// Main seeding function
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

  // 2) Build a map from metaId => exam info
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

  // 4) Build questionMap: metaId => array of question objects
  const questionMap: Record<string, QuestionJson[]> = {};

  for (const qFile of questionFiles) {
    const metaId = qFile.replace(".json", "");
    if (!metaMap[metaId]) {
      logWarn(`No meta found for question file: ${qFile}`);
      continue;
    }

    const questionFilePath = path.join(qFolderAbsolute, qFile);
    let rawData: any;
    try {
      rawData = JSON.parse(fs.readFileSync(questionFilePath, "utf-8"));
    } catch (err) {
      logError(`Failed to parse question file: ${qFile}, err=${err}`);
      continue;
    }

    if (!rawData || !rawData.results || !Array.isArray(rawData.results)) {
      logWarn(`No valid "results" array in file: ${qFile}`);
      continue;
    }

    let allQuestions: QuestionJson[] = [];
    for (const block of rawData.results) {
      if (block.questions && Array.isArray(block.questions)) {
        allQuestions = allQuestions.concat(block.questions);
      }
    }
    if (allQuestions.length === 0) {
      logWarn(`Found 0 questions in file: ${qFile}`);
      continue;
    }

    questionMap[metaId] = allQuestions;
  }

  // 5) For each metaId => upsert exam => chunked createMany (no transaction)
  for (const [metaId, examMeta] of Object.entries(metaMap)) {
    const matchedQuestions = questionMap[metaId];
    if (!matchedQuestions || matchedQuestions.length === 0) {
      logWarn(`No question file matched metaId: ${metaId}`);
      continue;
    }

    logInfo(`\n=== Processing metaId: ${metaId} => ${examMeta.title} ===`);

    try {
      // (A) Upsert exam (simple upsert, no transaction)
      const exam = await prisma.exam.upsert({
        where: { key: examMeta.key },
        update: {},
        create: {
          examGroup: examMeta.examGroup || null,
          country: examMeta.country || null,
          exam: examMeta.exam || null,
          key: examMeta.key,
          date: toDateOrNull(examMeta.date),
          description: examMeta.description ?? null,
          isMemoryBased: examMeta.isMemoryBased ?? false,
          isOnline: examMeta.isOnline ?? false,
          languages: examMeta.languages || [],
          title: examMeta.title,
          year: examMeta.year ?? null,
          pyq: examMeta.pyq
            ? {
                create: {
                  out_of_syllabus: examMeta.pyq.count.out_of_syllabus,
                  total: examMeta.pyq.count.total,
                  private: examMeta.pyq.count.private,
                  public: examMeta.pyq.count.public,
                },
              }
            : undefined,
        },
      });
      logInfo(`Upserted exam => ${exam.title} (id: ${exam.id})`);

      // (B) Transform questions
      const validQuestions = matchedQuestions.filter(
        (q) => q.question_id && q.question_id.trim() !== ""
      );
      if (!validQuestions.length) {
        logWarn(`No valid 'question_id' found for metaId: ${metaId}`);
        continue;
      }

      const questionCreateData = validQuestions.map((q) => {
        const questionId = q.question_id.trim();

        // Extract text from question.en.content or question.content
        const textFromJson =
          q.question?.en?.content?.trim() ||
          q.question?.content?.trim() ||
          "No text available";

        // Because your schema has `options String[]`, we must flatten objects:
        let optionsArray: string[] = [];
        if (q.question?.en?.options && Array.isArray(q.question.en.options)) {
          optionsArray = q.question.en.options.map((opt: any) => {
            if (opt && typeof opt === "object") {
              // Combine identifier + content into a single string:
              // e.g. "A: both (A) and (B) can be optically active."
              const identifier = opt.identifier ?? "";
              const content = opt.content ?? "";
              return `${identifier}: ${content}`.trim();
            } else {
              // If there's a weird case that's not an object
              return String(opt);
            }
          });
        }

        // Single correct option
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
          // required unique question id
          questionId,

          // foreign key to the exam we just upserted
          examId: exam.id,

          // Some optional "Exam" fields
          examGroup: q.examGroup || null,
          country: q.country || null,
          exam: q.exam || null,

          // classification
          subjectGroup: q.subjectGroup || null,
          subject: q.subject || null,
          chapterGroup: q.chapterGroup || null,
          chapter: q.chapter || null,
          topicName: q.topicName || null,
          topic: q.topic || null,
          difficulty: q.difficulty || null,
          type: q.type || null,

          // numeric
          year: q.year ?? null,
          paperTitle: q.paperTitle ?? null,
          timeAllotted: q.timeAllotted ?? null,
          marks: toFloatOrNull(q.marks),
          negMarks: toFloatOrNull(q.negMarks),
          updatedTime: toIntOrNull(q.updated_time),
          examDate: toDateOrNull(q.examDate),

          // booleans
          isOutOfSyllabus: q.isOutOfSyllabus ?? null,
          isBonus: q.isBonus ?? null,

          // strings
          yearKey: q.yearKey || null,
          permalink: q.permalink || null,
          languages: q.languages || [],

          // required question text
          text: textFromJson,

          // Flattened string array of options
          options: optionsArray,

          // Single correct option
          correctOption,

          // store entire question block in 'content'
          // (this is a Json? field, so we can store the full question object)
          content: toNullableJson(q.question),

          // default to ACTIVE
          status: QuestionStatus.ACTIVE,
        };
      });

      // (C) Insert in chunks, no transaction
      const CHUNK_SIZE = 100;
      const chunks = chunkArray(questionCreateData, CHUNK_SIZE);
      let totalInserted = 0;

      for (const chunk of chunks) {
        try {
          const res = await prisma.question.createMany({
            data: chunk,
            skipDuplicates: true,
          });
          totalInserted += res.count;
        } catch (err) {
          logError(`Insert chunk failed for metaId: ${metaId}. Error: ${err}`);
          // You could break or continue depending on your preference
        }
      }

      logInfo(`Inserted ${totalInserted} questions for exam: ${exam.title}`);
    } catch (err) {
      logError(`Error seeding data for metaId: ${metaId}: ${err}`);
    }
  }

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
