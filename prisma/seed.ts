/**
 * seed.ts
 * 
 * Uses best practices for robust data loading:
 * 1) Validate and filter data
 * 2) Chunked inserts (createMany)
 * 3) One transaction per exam (rolls back partial data at exam level)
 * 4) Structured logs and error handling
 */

///////////////////////////////
// CommonJS + TS imports
///////////////////////////////
const fs = require("fs");
const path = require("path");

// Prisma Client + namespace
import { PrismaClient, Prisma as PrismaNS, QuestionStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

///////////////////////////////
// Logger (for illustration)
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
// Chunking Helper
///////////////////////////////
/**
 * chunkArray splits an array into multiple sub-arrays ("chunks"),
 * each up to `size` elements long.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

///////////////////////////////
// Helper Conversions
///////////////////////////////
function toNullableJson(
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return PrismaNS.DbNull;
  }
  return value as Prisma.InputJsonValue;
}

function toStringOrNull(value: any): string | null {
  if (value == null) return null;
  return String(value).trim();
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
  return Number.isNaN(date.getTime()) ? null : date;
}

///////////////////////////////
// Prisma
///////////////////////////////
const prisma = new PrismaClient();

///////////////////////////////
// Types (simplified)
///////////////////////////////
interface ExamMeta {
  metaId: string;
  country: string;
  exam: string;
  examGroup: string;
  key: string;
  date: string;
  description?: string | null;
  isOnline?: boolean;
  isMemoryBased?: boolean;
  languages: string[];
  title: string;
  year: number;
  pyq: {
    count: {
      out_of_syllabus: number;
      total: number;
      private: number;
      public: number;
    };
  };
}

interface QuestionJson {
  question_id: string;
  country?: string | null;
  examGroup?: string | null;
  exam?: string | null;
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
    metaArray = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
    if (!Array.isArray(metaArray)) {
      throw new Error("Meta file is not an array of objects");
    }
  } catch (err) {
    logError(`Failed to parse meta file: ${err}`);
    return;
  }

  // 2) Build metaMap
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

  // questionMap: metaId => QuestionJson[]
  const questionMap: Record<string, QuestionJson[]> = {};

  // parse each question file
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

    // Assume the JSON is an array of questions
    let items: QuestionJson[] = Array.isArray(raw) ? raw : raw.questions ?? raw;
    if (!Array.isArray(items)) {
      logWarn(`No valid array of questions in file: ${qFile}`);
      continue;
    }

    // Store in questionMap
    questionMap[metaId] = items;
  }

  // 4) For each metaId, we do a transaction so the exam + questions are inserted together or not at all
  for (const [metaId, metaObj] of Object.entries(metaMap)) {
    const matchedQuestions = questionMap[metaId];
    if (!matchedQuestions || matchedQuestions.length === 0) {
      logWarn(`No question file matched metaId: ${metaId}`);
      continue;
    }

    logInfo(`\n=== Processing metaId: ${metaId} => ${metaObj.title} ===`);

    // Filter + validate questions
    const allValidQuestions: QuestionJson[] = [];
    const invalidQuestions: QuestionJson[] = [];

    for (const q of matchedQuestions) {
      if (!q.question_id || !q.question_id.trim()) {
        invalidQuestions.push(q);
      } else {
        allValidQuestions.push(q);
      }
    }

    if (invalidQuestions.length > 0) {
      logWarn(
        `Found ${invalidQuestions.length} invalid questions (no question_id) for metaId: ${metaId}`
      );
    }
    if (!allValidQuestions.length) {
      logWarn(`No valid questions for metaId: ${metaId} — skipping.`);
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // (a) Upsert exam
        const exam = await tx.exam.upsert({
          where: { key: metaObj.key },
          update: {},
          create: {
            examGroup: metaObj.examGroup,
            country: metaObj.country,
            exam: metaObj.exam,
            key: metaObj.key,
            date: toDateOrNull(metaObj.date),
            description: metaObj.description ?? null,
            isMemoryBased: metaObj.isMemoryBased ?? false,
            isOnline: metaObj.isOnline ?? false,
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
        logInfo(`Upserted exam => ${exam.title} (id: ${exam.id})`);

        // (b) Build data for createMany
        const questionCreateData = allValidQuestions.map((q) => {
          const questionId = q.question_id.trim();
          const textContent =
            q.question?.en?.content?.trim() ||
            "No text available"; // Required for schema's Question.text

          // Attempt to parse an array of options from e.g. q.question.en.options
          let optionsArray: string[] = [];
          if (
            q.question?.en?.options &&
            Array.isArray(q.question.en.options)
          ) {
            optionsArray = q.question.en.options.map(String);
          }

          // Determine correctOption (if you store only one)
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

          // Explanation as JSON
          let explanationValue: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
            PrismaNS.DbNull;
          if (q.question?.en?.explanation) {
            explanationValue = toNullableJson({
              en: q.question.en.explanation,
              hi: q.question?.hi?.explanation ?? null,
            });
          }

          return {
            questionId,
            examId: exam.id,

            // Direct mappings
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
            // required text field
            text: textContent,
            options: optionsArray,
            correctOption,
            explanation: explanationValue,
            // store entire question object in 'content'
            content: toNullableJson(q.question),
            status: QuestionStatus.ACTIVE,
          };
        });

        // (c) Chunk insertion to avoid single huge createMany
        const CHUNK_SIZE = 500;
        const chunks = chunkArray(questionCreateData, CHUNK_SIZE);

        let totalCreated = 0;
        for (const chunk of chunks) {
          // createMany in a smaller batch
          const result = await tx.question.createMany({
            data: chunk,
            skipDuplicates: true,
          });
          totalCreated += result.count;
        }

        logInfo(
          `Created ${totalCreated} question records for exam: ${exam.title}`
        );
      }); // end transaction

      logInfo(`Transaction committed successfully for metaId: ${metaId}`);
    } catch (err) {
      // If an error is thrown inside the transaction callback,
      // Prisma automatically rolls back that entire transaction.
      logError(
        `Transaction failed for metaId: ${metaId}. Rolling back. Error: ${err}`
      );
      // We continue to the next metaId
    }
  }

  // Cleanup
  logInfo("All meta files processed. Closing Prisma.");
  await prisma.$disconnect();
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((err) => {
    logError(`Seeding script crashed unexpectedly: ${err}`);
    process.exit(1);
  });
