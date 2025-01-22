/**
 * seed.ts (CommonJS + TypeScript)
 * 
 * Key Differences from "basic" script:
 * 1. Parse the "results[].questions[]" structure in each question file.
 * 2. For each metaId file, collect all question objects into a single array.
 * 3. Upsert exam in a transaction, then createMany (chunked).
 * 4. Type annotate `tx` with Prisma.TransactionClient to avoid TS warnings.
 */

///////////////////////////////
// CommonJS requires
///////////////////////////////
const fs = require("fs");
const path = require("path");
import type { Prisma } from "@prisma/client"; // only the type
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
// Types
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
  // Possibly other fields like "liveAt", "testId", etc.
}

/** Shaped like your question JSON example. */
interface QuestionFile {
  statusCode?: number;
  results: {
    _id?: string;
    questions: QuestionJson[];
  }[];
}

/** The question objects inside results[].questions */
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
  question?: any; // deeper nested fields
  updated_time?: number | null;
  permalink?: string | null;
  paperId?: string | null;
  topic?: string | null;
  isOutOfSyllabus?: boolean | null;
  isBonus?: boolean | null;
  yearKey?: string | null;
}

/**
 * Main seeding logic
 */
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

  // 2) Build metaMap by metaId
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

  // 4) For each file, parse -> gather all questions from results[].questions
  for (const qFile of questionFiles) {
    const metaId = qFile.replace(".json", "");
    if (!metaMap[metaId]) {
      // We'll warn but keep going
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

    // According to your snippet, it looks like:
    // { "statusCode": 0, "results": [ { "_id": "...", "questions": [...]} ] }
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

  // 5) For each metaId in metaMap, if we have questions -> Upsert exam + createMany
  for (const [metaId, metaObj] of Object.entries(metaMap)) {
    const matchedQuestions = questionMap[metaId];
    if (!matchedQuestions || matchedQuestions.length === 0) {
      // Possibly a meta entry that has no .json file in question folder
      logWarn(`No question file matched metaId: ${metaId}`);
      continue;
    }

    logInfo(`\n=== Processing metaId: ${metaId} => ${metaObj.title} ===`);

    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // (a) Upsert exam
        const exam = await tx.exam.upsert({
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

            // create pyq if available
            pyq: metaObj.pyq
              ? {
                  create: {
                    out_of_syllabus: metaObj.pyq.count.out_of_syllabus,
                    total: metaObj.pyq.count.total,
                    private: metaObj.pyq.count.private,
                    public: metaObj.pyq.count.public
                  }
                }
              : undefined
          }
        });
        logInfo(`Upserted exam => ${exam.title} (id: ${exam.id})`);

        // (b) Prepare array of questions for createMany
        // Validate minimum fields, e.g. question_id
        const validQuestions = matchedQuestions.filter(
          (q) => q.question_id && q.question_id.trim() !== ""
        );
        if (!validQuestions.length) {
          logWarn(`No valid 'question_id' found for metaId: ${metaId}`);
          return; // skip
        }

        // Convert each question
        const questionCreateData = validQuestions.map((q) => {
          const questionId = q.question_id.trim();
          const textContent =
            q.question?.en?.content?.trim() ||
            q.question?.content?.trim() ||
            "No text available";

          // attempt to parse an array of options from q.question.en.options
          let optionsArray: string[] = [];
          if (q.question?.en?.options && Array.isArray(q.question.en.options)) {
            optionsArray = q.question.en.options.map(String);
          }

          // If there's a single correct option
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

            // Required text
            text: textContent,
            // Options + correct
            options: optionsArray,
            correctOption,

            // Explanation, content, etc.
            // Store entire question block in 'content'
            content: toNullableJson(q.question),
            status: QuestionStatus.ACTIVE
          };
        });

        // (c) Insert in chunks
        const CHUNK_SIZE = 500;
        const chunks = chunkArray(questionCreateData, CHUNK_SIZE);
        let totalCreated = 0;
        for (const chunk of chunks) {
          const res = await tx.question.createMany({
            data: chunk,
            skipDuplicates: true
          });
          totalCreated += res.count;
        }
        logInfo(`Inserted ${totalCreated} questions for exam: ${exam.title}`);
      }); // end $transaction

      logInfo(`Transaction committed successfully for metaId: ${metaId}`);
    } catch (err) {
      logError(
        `Transaction failed for metaId: ${metaId}, rolling back. Error: ${err}`
      );
    }
  }

  logInfo("All meta files processed. Closing Prisma.");
  await prisma.$disconnect();
}

// Run main
main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    logError(`Seeding script crashed unexpectedly: ${err}`);
    process.exit(1);
  });
