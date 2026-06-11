import { z } from "zod";

/**
 * Canonical question format for the digital question bank.
 *
 * Question text, options and markscheme are Markdown with LaTeX math
 * ($...$ inline, $$...$$ display) — the same convention MathRenderer and
 * the existing data already use.
 */
export const QUESTION_TYPES = [
  "Multiple Choice", // exactly one correct option (correctOption)
  "Multiple Correct", // one or more correct options (correctOptions)
  "Integer", // whole-number answer (answerText)
  "Numerical", // numeric answer, optionally a range (answerMin..answerMax)
  "Subjective", // free-form written answer (answerText = model answer)
] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const questionStatusSchema = z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]);

export const questionBaseSchema = z.object({
  questionId: z.string().trim().min(1).max(120).optional(),
  text: z.string().trim().min(1, "Question text is required").max(20_000),
  type: questionTypeSchema.default("Multiple Choice"),

  options: z.array(z.string().trim().min(1).max(5_000)).max(10).default([]),
  // Accepts a letter key ("A"–"J") or the full option text (legacy admin
  // form behavior) — normalized to a letter key by normalizeOptionKeys.
  correctOption: z.string().trim().min(1).max(5_000).nullish(),
  correctOptions: z.array(z.string().trim().min(1).max(5_000)).max(10).default([]),
  answerText: z.string().trim().max(20_000).nullish(),
  answerMin: z.coerce.number().finite().nullish(),
  answerMax: z.coerce.number().finite().nullish(),

  exam: z.string().trim().max(200).nullish(),
  subject: z.string().trim().max(200).nullish(),
  topic: z.string().trim().max(200).nullish(),
  subtopic: z.string().trim().max(200).nullish(),
  chapter: z.string().trim().max(200).nullish(),
  difficulty: z.string().trim().max(50).nullish(),
  year: z.coerce.number().int().min(1900).max(2100).nullish(),
  yearKey: z.string().trim().max(200).nullish(),
  paperTitle: z.string().trim().max(500).nullish(),
  source: z.string().trim().max(500).nullish(),

  marks: z.coerce.number().finite().nullish(),
  negMarks: z.coerce.number().finite().nullish(),
  markscheme: z.string().trim().max(50_000).nullish(),
  // Free-form JSON, but size-capped so it can't be abused to bloat the column.
  explanation: z
    .unknown()
    .optional()
    .refine(
      (v) => v === undefined || v === null || JSON.stringify(v).length <= 50_000,
      "explanation is too large"
    ),
  diagramUrl: z.string().trim().max(2_000).nullish(),
  customTags: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  status: questionStatusSchema.optional(),
  languages: z.array(z.string().trim().max(10)).max(20).optional(),
});

/**
 * Maps correct-answer references given as full option text to letter keys
 * ("A" = options[0], ...). Letter keys pass through unchanged; unmatched
 * values are left as-is so validateAnswerShape can flag them.
 */
function normalizeOptionKeys<
  T extends {
    options: string[];
    correctOption?: string | null;
    correctOptions: string[];
  }
>(q: T): T {
  const toKey = (value: string): string => {
    const trimmed = value.trim();
    if (/^[A-J]$/i.test(trimmed)) return trimmed.toUpperCase();
    const index = q.options.findIndex((o) => o.trim() === trimmed);
    return index >= 0 ? String.fromCharCode(65 + index) : trimmed;
  };
  return {
    ...q,
    correctOption: q.correctOption ? toKey(q.correctOption) : q.correctOption,
    correctOptions: q.correctOptions.map(toKey),
  };
}

/**
 * Per-type consistency rules, shared by create and bulk import.
 *
 * DRAFT questions may omit answers (PDF imports often have no printed answer
 * key) — structural rules still apply, but answer presence is only required
 * for questions going live (ACTIVE/ARCHIVED).
 */
function validateAnswerShape(
  q: z.infer<typeof questionBaseSchema>,
  ctx: z.RefinementCtx
) {
  const fail = (message: string, path: (string | number)[]) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

  const requireAnswer = q.status !== "DRAFT";

  switch (q.type) {
    case "Multiple Choice":
      if (q.options.length < 2)
        fail("Multiple Choice questions need at least 2 options", ["options"]);
      if (requireAnswer && !q.correctOption)
        fail("Multiple Choice questions need a correctOption", ["correctOption"]);
      break;
    case "Multiple Correct":
      if (q.options.length < 2)
        fail("Multiple Correct questions need at least 2 options", ["options"]);
      if (requireAnswer && q.correctOptions.length < 1)
        fail("Multiple Correct questions need at least one correctOptions entry", [
          "correctOptions",
        ]);
      break;
    case "Integer":
      if (
        requireAnswer &&
        (q.answerText == null || !/^-?\d+$/.test(q.answerText.trim()))
      )
        fail("Integer questions need a whole-number answerText", ["answerText"]);
      if (q.answerText != null && q.answerText !== "" && !/^-?\d+$/.test(q.answerText.trim()))
        fail("Integer answers must be whole numbers", ["answerText"]);
      break;
    case "Numerical":
      if (
        requireAnswer &&
        q.answerMin == null &&
        q.answerMax == null &&
        q.answerText == null
      )
        fail(
          "Numerical questions need answerText or an answerMin/answerMax range",
          ["answerText"]
        );
      if (q.answerMin != null && q.answerMax != null && q.answerMin > q.answerMax)
        fail("answerMin must be <= answerMax", ["answerMin"]);
      break;
    case "Subjective":
      // Model answer is optional; nothing to enforce.
      break;
  }

  // Correct option keys must be letter keys referencing an existing option
  // (A = index 0, ...). normalizeOptionKeys runs first, so anything that is
  // not a letter key here failed to match any option's text.
  const referenced = [
    ...(q.correctOption ? [q.correctOption] : []),
    ...q.correctOptions,
  ];
  for (const key of referenced) {
    if (!/^[A-J]$/.test(key)) {
      fail(
        `Correct option "${key.slice(0, 50)}" does not match any option`,
        ["correctOption"]
      );
      continue;
    }
    const index = key.charCodeAt(0) - 65;
    if (index >= q.options.length)
      fail(`Correct option "${key}" has no matching option`, ["options"]);
  }
}

export const questionCreateSchema = questionBaseSchema
  .transform(normalizeOptionKeys)
  .superRefine(validateAnswerShape);
export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;

/** Admin PATCH: any known field, keyed by questionId. */
export const questionUpdateSchema = questionBaseSchema
  .partial()
  .extend({ questionId: z.string().trim().min(1) })
  .transform((q) => {
    // Normalize text-valued correct answers to letter keys when the options
    // array is part of the same payload — but never introduce fields the
    // caller didn't send (a PATCH must not reset absent columns).
    if (!q.options) return q;
    const normalized = normalizeOptionKeys({
      options: q.options,
      correctOption: q.correctOption ?? null,
      correctOptions: q.correctOptions ?? [],
    });
    return {
      ...q,
      ...(q.correctOption !== undefined
        ? { correctOption: normalized.correctOption }
        : {}),
      ...(q.correctOptions !== undefined
        ? { correctOptions: normalized.correctOptions }
        : {}),
    };
  });

/**
 * Non-admin PATCH: only per-user study state (completed/reviewed, routed to
 * the per-user UserProgress table by the handler) and community customTags.
 * `difficulty`/`difficultyRating` are intentionally NOT here — they are global
 * question content and must not be writable by members (a member must not be
 * able to change a question's difficulty for everyone). `.strict()` rejects
 * anything else.
 */
export const memberQuestionPatchSchema = z
  .object({
    questionId: z.string().trim().min(1),
    completed: z.boolean().optional(),
    reviewed: z.boolean().optional(),
    customTags: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  })
  .strict();

export const bulkImportSchema = z.object({
  fileName: z.string().trim().min(1).max(500),
  pageCount: z.number().int().min(0).max(2_000).optional(),
  tokensUsed: z.number().int().min(0).optional(),
  questions: z.array(questionCreateSchema).min(1).max(500),
});

/** Maps a validated question to a Prisma `Question` create payload. */
export function toQuestionCreateData(input: QuestionCreateInput) {
  const { customTags, explanation, ...rest } = input;
  return {
    ...rest,
    questionId: input.questionId ?? globalThis.crypto.randomUUID(),
    customTag: customTags?.length ? customTags.join(",") : undefined,
    // Prisma Json columns reject raw null (it requires Prisma.JsonNull);
    // treat null as "not provided".
    explanation: explanation == null ? undefined : (explanation as any),
  };
}
