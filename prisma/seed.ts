/**
 * seed.ts
 *
 * Reads all exam meta .json files in `!metaid/`.
 * For each <basename>.json => finds `past-papers/<basename>` folder => reads question .json => flattens `results[].questions`.
 * Upserts each Exam by exam.key, then upserts each Question by questionId (one-by-one, chunked).
 * We include all fields from your Prisma schema, or default to null if not in the JSON.
 * We also define 'title' and 'subjectGroup' (etc.) in the QuestionJson interface to avoid TS errors.
 */

///////////////////////////////
// 1) Imports & Setup
///////////////////////////////
import fs from "fs";
import path from "path";
import { PrismaClient, Prisma as PrismaNS, QuestionStatus } from "@prisma/client";

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

/**
 * If the incoming value is nullish, we can return undefined => the field is omitted.
 * That means the DB column won't be changed on update. Alternatively, if you want
 * literal JSON null, you can do `return PrismaNS.JsonNull;`.
 */
function toNullableJson(value: unknown): PrismaNS.InputJsonValue | undefined {
  if (value == null) {
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

/** Chunk array to avoid massive single transactions. */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

///////////////////////////////
// 3) Types
///////////////////////////////

/**
 * The "ExamMeta" interface for your exam metadata JSON in `!metaid`.
 */
interface ExamMeta {
  metaId: string;
  key: string;        // upsert by exam.key
  title: string;
  examGroup?: string;
  country?: string;
  exam?: string;
  date?: string;
  description?: string;
  isOnline?: boolean;
  isMemoryBased?: boolean;
  languages?: string[];
  year?: number;
}

/**
 * The structure of each question in "past-papers" JSON files.
 * We define optional properties for *all* fields your code references.
 */
interface QuestionJson {
  question_id: string;          // required unique ID

  // The ones TypeScript complained were missing:
  title?: string | null;
  subjectGroup?: string | null;
  paperTitle?: string | null;
  timeAllotted?: number | null;
  yearKey?: string | null;
  chapter?: string | null;
  chapterGroup?: string | null;
  topicName?: string | null;

  // Other fields from your schema or code:
  examGroup?: string | null;
  country?: string | null;
  exam?: string | null;
  languages?: string[];
  year?: number | null;
  difficulty?: string | null;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  type?: string | null;
  marks?: number | null;
  negMarks?: number | null;
  updated_time?: number | null;
  examDate?: string | null;
  isMemoryBased?: boolean | null;
  isOnline?: boolean | null;
  description?: string | null;
  key?: string | null;
  date?: string | null;
  isOutOfSyllabus?: boolean | null;
  isBonus?: boolean | null;
  source?: string | null;
  paperId?: string | null;
  permalink?: string | null;

  // For JSON data
  question?: any; // we'll store in `content`
  linkedResources?: any;
  commonMistakes?: any;
}

/**
 * The blocks in question files: results[].questions
 */
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

  // A) Gather all .json in !metaid
  if (!fs.existsSync(metaDir)) {
    logError(`Meta folder does not exist: ${metaDir}`);
    return;
  }
  const metaFiles = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json"));
  if (!metaFiles.length) {
    logWarn(`No meta .json found in: ${metaDir}`);
    return;
  }

  // B) For each meta file => parse => find matching question folder => parse => upsert
  for (const metaFile of metaFiles) {
    const metaFilePath = path.join(metaDir, metaFile);

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

    // baseName => e.g. "jee_jee-main.json" => "jee_jee-main"
    const baseName = metaFile.replace(".json", "");
    const questionFolder = path.join(pastPapersDir, baseName);

    if (!fs.existsSync(questionFolder)) {
      logWarn(`No question folder: ${questionFolder}`);
      continue;
    }

    // C) Flatten all question JSON in that folder
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
            if (block?.questions && Array.isArray(block.questions)) {
              allQuestions = allQuestions.concat(block.questions);
            }
          }
        }
      } catch (err) {
        logError(`Failed to parse question file ${qFile}: ${err}`);
      }
    }

    // D) If no questions, skip
    if (!allQuestions.length) {
      logWarn(`No questions in folder: ${questionFolder}`);
      continue;
    }

    // E) Upsert each exam in metaArray => upsert matching questions
    for (const examMeta of metaArray) {
      if (!examMeta.metaId) {
        logWarn(`Skipping examMeta with no metaId: ${JSON.stringify(examMeta)}`);
        continue;
      }

      logInfo(`\n=== Processing metaId=${examMeta.metaId} => ${examMeta.title} ===`);

      // 1) Upsert Exam
      const exam = await prisma.exam.upsert({
        where: { key: examMeta.key },
        update: {},
        create: {
          examGroup: examMeta.examGroup ?? null,
          country: examMeta.country ?? null,
          exam: examMeta.exam ?? null,
          key: examMeta.key,
          date: toDateOrNull(examMeta.date),
          description: examMeta.description ?? null,
          isMemoryBased: examMeta.isMemoryBased ?? false,
          isOnline: examMeta.isOnline ?? false,
          languages: examMeta.languages ?? [],
          title: examMeta.title,
          year: examMeta.year ?? null,
        },
      });
      logInfo(`Upserted exam => ${exam.title} (id: ${exam.id})`);

      // 2) Filter valid question IDs
      const validQuestions = allQuestions.filter(
        (q) => q.question_id && q.question_id.trim() !== ""
      );
      if (!validQuestions.length) {
        logWarn(`No valid question_id for metaId=${examMeta.metaId}`);
        continue;
      }

      // 3) Build question data
      const questionRows = validQuestions.map((q) => {
        const questionId = q.question_id.trim();

        // Required text
        const textFromJson =
          q.question?.en?.content?.trim() ||
          q.question?.content?.trim() ||
          "No text available";

        // Flatten options => string[]
        let optionsArr: string[] = [];
        if (q.question?.en?.options && Array.isArray(q.question.en.options)) {
          optionsArr = q.question.en.options.map((opt: any) => {
            if (opt && typeof opt === "object") {
              const identifier = opt.identifier ?? "";
              const content = opt.content ?? "";
              return `${identifier}: ${content}`.trim();
            }
            return String(opt);
          });
        }

        // Single correct option?
        let correctOpt: string | null = null;
        if (
          q.question?.en?.correct_options &&
          Array.isArray(q.question.en.correct_options) &&
          q.question.en.correct_options.length > 0
        ) {
          correctOpt = q.question.en.correct_options[0];
        } else if (q.question?.en?.answer) {
          correctOpt = String(q.question.en.answer);
        }

        // For JSON fields that can't accept raw null => either omit or use Prisma.JsonNull.
        // We'll do a "ternary + toNullableJson" approach here:
        const linkedRes = q.linkedResources
          ? toNullableJson(q.linkedResources)
          : PrismaNS.JsonNull;
        const commonMistakesVal = q.commonMistakes
          ? toNullableJson(q.commonMistakes)
          : PrismaNS.JsonNull;

        return {
          // Fields from your schema
          updatedAt: new Date(),   // always required
          questionId,
          examId: exam.id,

          examGroup: q.examGroup ?? null,
          country: q.country ?? null,
          exam: q.exam ?? null,
          key: q.key ?? null,
          date: toDateOrNull(q.date),
          description: q.description ?? null,
          isMemoryBased: q.isMemoryBased ?? null,
          isOnline: q.isOnline ?? null,
          languages: q.languages ?? [],
          title: q.title ?? null,
          year: q.year ?? null,

          // etc...
          text: textFromJson,
          subject: q.subject ?? null,
          topic: q.topic ?? null,
          subtopic: q.subtopic ?? null,
          difficulty: q.difficulty ?? null,
          type: q.type ?? null,
          marks: toFloatOrNull(q.marks),
          negMarks: toFloatOrNull(q.negMarks),
          options: optionsArr,
          correctOption: correctOpt,

          paperTitle: q.paperTitle ?? null,
          timeAllotted: toIntOrNull(q.timeAllotted),
          updatedTime: toIntOrNull(q.updated_time),

          // JSON fields
          linkedResources: linkedRes,
          commonMistakes: commonMistakesVal,

          // Explanation from q.question?.en?.explanation if you have it
          explanation: toNullableJson(q.question?.en?.explanation),
          // ...
          status: QuestionStatus.ACTIVE,

          // Additional columns from your schema
          chapter: q.chapter ?? null,
          chapterGroup: q.chapterGroup ?? null,
          topicName: q.topicName ?? null,
          yearKey: q.yearKey ?? null,

          content: toNullableJson(q.question),
          examDate: toDateOrNull(q.examDate),
          isBonus: q.isBonus ?? null,
          isOutOfSyllabus: q.isOutOfSyllabus ?? null,
          paperId: q.paperId ?? null,
          permalink: q.permalink ?? null,
          subjectGroup: q.subjectGroup ?? null,
        };
      });

      // 4) Upsert in chunks
      const CHUNK_SIZE = 100;
      const chunks = chunkArray(questionRows, CHUNK_SIZE);

      let totalUpserted = 0;
      for (const chunk of chunks) {
        for (const data of chunk) {
          try {
            await prisma.question.upsert({
              where: { questionId: data.questionId },
              create: {
                ...data,
                updatedAt: new Date(),
              },
              update: {
                ...data,
                updatedAt: new Date(),
              },
            });
            totalUpserted++;
          } catch (err) {
            logError(`Upsert failed for questionId=${data.questionId}: ${err}`);
          }
        }
      }

      logInfo(`Upserted ${totalUpserted} questions for exam: ${exam.title}`);
    }
  }

  logInfo("All done. Closing Prisma.");
  await prisma.$disconnect();
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError(`Seeding script crashed unexpectedly: ${err}`);
    process.exit(1);
  });
