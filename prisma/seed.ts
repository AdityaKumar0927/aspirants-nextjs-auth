/**
 * seed.ts (TypeScript)
 *
 * 1) Reads all meta JSON files in `!metaid/`.
 * 2) For each <basename>.json, finds `past-papers/<basename>/`.
 * 3) Reads all question JSON in that folder, flattening `results[].questions`.
 * 4) Upserts exam by `exam.key`.
 * 5) Upserts each question individually by `questionId`, linking to `exam.id`.
 * 6) Sets `updatedAt = new Date()` to satisfy your schema's requirement.
 */

///////////////////////////////
// 1) Imports & Setup
///////////////////////////////
import fs from "fs";
import path from "path";
import { PrismaClient, Prisma as PrismaNS, QuestionStatus } from "@prisma/client";

// Instantiate the Prisma client
const prisma = new PrismaClient();

// Logger helpers
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
// 2) Helper Functions
///////////////////////////////

/** Return `undefined` so the JSON column is omitted => DB ends up NULL (for `Json?`). */
function toNullableJson(value: unknown): PrismaNS.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value as PrismaNS.InputJsonValue;
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

/** Chunk an array to avoid huge single queries or timeouts. */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

///////////////////////////////
// 3) Types for your data (Optional)
///////////////////////////////

interface ExamMeta {
  metaId: string;
  country?: string;
  exam?: string;
  examGroup?: string;
  key: string;          // used for upsert in `Exam`
  date?: string;
  description?: string | null;
  isOnline?: boolean;
  isMemoryBased?: boolean;
  languages?: string[];
  title: string;
  year?: number;
  // If you have a "Pyq" relation, you'd do it here. But your schema indicated type issues, so we skip it.
}

interface QuestionJson {
  question_id: string;  // used for upsert in `Question`
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
  question?: any;
  updated_time?: number | null;
  permalink?: string | null;
  paperId?: string | null;
  topic?: string | null;
  isOutOfSyllabus?: boolean | null;
  isBonus?: boolean | null;
  yearKey?: string | null;
  // Possibly more fields (e.g., 'bookmark', 'section')
}

interface QuestionFileBlock {
  _id?: string;
  questions: QuestionJson[];
}

///////////////////////////////
// 4) Main Seeding Function
///////////////////////////////
async function main() {
  const metaDir = "./!metaid";
  const pastPapersDir = "./past-papers";

  // (A) Read all meta JSON files in `!metaid`
  if (!fs.existsSync(metaDir)) {
    logError(`Meta folder does not exist: ${metaDir}`);
    return;
  }
  const metaFiles = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json"));
  if (metaFiles.length === 0) {
    logWarn(`No meta JSON files in: ${metaDir}`);
    return;
  }

  // (B) For each meta file
  for (const metaFile of metaFiles) {
    const metaFilePath = path.join(metaDir, metaFile);

    // Parse the array of exam metadata
    let metaArray: ExamMeta[];
    try {
      const raw = fs.readFileSync(metaFilePath, "utf-8");
      metaArray = JSON.parse(raw);
      if (!Array.isArray(metaArray)) {
        logWarn(`Meta file ${metaFile} is not an array; skipping`);
        continue;
      }
    } catch (err) {
      logError(`Failed to parse meta file ${metaFile}: ${err}`);
      continue;
    }

    // baseName => e.g. "jee_jee-main.json" -> "jee_jee-main"
    const baseName = metaFile.replace(".json", "");
    // matching folder => e.g. ./past-papers/jee_jee-main
    const questionFolder = path.join(pastPapersDir, baseName);

    if (!fs.existsSync(questionFolder)) {
      logWarn(`No question folder found for ${baseName}: ${questionFolder}`);
      continue;
    }

    // (C) Read all .json in that subfolder => gather questions
    const questionFiles = fs
      .readdirSync(questionFolder)
      .filter((f) => f.endsWith(".json"));

    let allQuestions: QuestionJson[] = [];
    for (const qFile of questionFiles) {
      const qFilePath = path.join(questionFolder, qFile);
      try {
        const rawQ = fs.readFileSync(qFilePath, "utf-8");
        const parsedQ = JSON.parse(rawQ);
        if (parsedQ && Array.isArray(parsedQ.results)) {
          for (const block of parsedQ.results as QuestionFileBlock[]) {
            if (block.questions && Array.isArray(block.questions)) {
              allQuestions = allQuestions.concat(block.questions);
            }
          }
        }
      } catch (err) {
        logError(`Failed to parse question file ${qFile}: ${err}`);
      }
    }

    // If no questions found, skip
    if (!allQuestions.length) {
      logWarn(`No questions found in folder: ${questionFolder}`);
      continue;
    }

    // (D) For each examMeta in metaArray => upsert exam => upsert questions
    for (const examMeta of metaArray) {
      if (!examMeta.metaId) {
        logWarn(`Skipping examMeta with no metaId: ${JSON.stringify(examMeta)}`);
        continue;
      }

      logInfo(`\n=== Processing metaId=${examMeta.metaId} => ${examMeta.title} ===`);

      // 1) Upsert the exam with an inline typed variable
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
          // If you want to handle Pyq, add here if your schema matches
        },
      });
      logInfo(`Upserted exam => ${exam.title} (id: ${exam.id})`);

      // 2) Filter out invalid question IDs
      const validQuestions = allQuestions.filter(
        (q) => q.question_id && q.question_id.trim() !== ""
      );
      if (!validQuestions.length) {
        logWarn(`No valid question_id found in folder for metaId=${examMeta.metaId}`);
        continue;
      }

      // 3) Build the data array
      const questionCreateData = validQuestions.map((q) => {
        const questionId = q.question_id.trim();
        const textFromJson =
          q.question?.en?.content?.trim() ||
          q.question?.content?.trim() ||
          "No text available";

        // Flatten options => string[] if needed
        let optionsArray: string[] = [];
        if (q.question?.en?.options && Array.isArray(q.question.en.options)) {
          optionsArray = q.question.en.options.map((opt: any) => {
            if (opt && typeof opt === "object") {
              const identifier = opt.identifier ?? "";
              const content = opt.content ?? "";
              return `${identifier}: ${content}`.trim();
            }
            return String(opt);
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

          text: textFromJson,
          options: optionsArray,
          correctOption,

          // The entire question object, if you want, in `content`
          content: toNullableJson(q.question),

          // Our schema requires updatedAt
          updatedAt: new Date(),
          status: QuestionStatus.ACTIVE,

          // If your schema has e.g. paperId, add it:
          paperId: q.paperId ?? null,
          // etc. ...
        };
      });

      // 4) Upsert each question in chunks
      const CHUNK_SIZE = 100;
      const chunks = chunkArray(questionCreateData, CHUNK_SIZE);

      let totalUpserted = 0;
      for (const chunk of chunks) {
        for (const data of chunk) {
          try {
            await prisma.question.upsert({
              where: { questionId: data.questionId },
              create: {
                ...data,
                updatedAt: new Date(), // must set in create
              },
              update: {
                ...data,
                updatedAt: new Date(), // must set in update
              },
            });
            totalUpserted++;
          } catch (err) {
            logError(`Upsert failed for questionId=${data.questionId}: ${err}`);
          }
        }
      }

      logInfo(`Upserted ${totalUpserted} questions for exam: ${exam.title}`);
    } // end for examMeta
  } // end for metaFiles

  logInfo("All done. Closing Prisma.");
  await prisma.$disconnect();
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError(`Seeding script crashed unexpectedly: ${err}`);
    process.exit(1);
  });
