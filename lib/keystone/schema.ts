/**
 * Keystone — the lesson contract.
 *
 * The student's own LLM returns ONE JSON object in this shape (the prompt in
 * lib/keystone/prompt.ts asks for exactly these fields). This module validates
 * it LENIENTLY: it never throws, normalizes messy output, fills missing optional
 * fields, and reports `warnings` (non-fatal) plus `missing` (so the handoff can
 * ask the LLM to "continue from here"). Pure — no server deps; runs in the browser.
 */

/* ------------------------------- types ---------------------------------- */

export interface KConcept {
  id: string;
  name: string;
  dependsOn: string[];
}
export interface KConceptMap {
  summary: string | null;
  concepts: KConcept[];
}
export interface KPrereq {
  question: string;
  modelAnswer: string;
  ifShaky: string | null;
  /** Auto-graded format (mirrors KCheck). "open" = legacy free-text reveal flow. */
  format: KCheckFormat;
  options: KOption[];
  answer: string | null;
  /** Short just-in-time re-teach shown on a WRONG answer, then a re-check. */
  refresher: string | null;
}
export interface KWorkedStep {
  text: string;
  selfExplain: string | null;
}
export interface KDerivationStep {
  prompt: string;
  answer: string;
}
/** Auto-graded answer type. "open" (the default) keeps the legacy free-text + self-score check. */
export type KCheckFormat = "mcq" | "integer" | "fillblank" | "short" | "open";
/** Cognitive level — keeps fact recall and conceptual/application checks distinct. */
export type KCheckLevel = "fact" | "concept" | "application";
/** One MCQ option. Each distractor names the misconception it embodies (diagnostic distractors). */
export interface KOption {
  text: string;
  correct: boolean;
  misconception: string | null;
}
export interface KCheck {
  kind: "retrieval" | "transfer";
  question: string;
  modelAnswer: string;
  rubric: string[];
  /** Auto-graded answer type. "open" (default) = free-text + manual self-score (legacy). */
  format: KCheckFormat;
  level: KCheckLevel | null;
  /** MCQ choices — only populated when format === "mcq". */
  options: KOption[];
  /** Canonical answer for integer/fillblank/short auto-grading. */
  answer: string | null;
}
export interface KMisconception {
  misconception: string;
  correction: string;
}
export interface KTeachBack {
  whatToExplain: string;
  checklist: string[];
}
/** A generative act done on the student's OWN paper (compare-to-model optional). */
export type KGenerativeKind = "summarize" | "draw" | "imagine" | "selfexplain" | "other";
export interface KGenerative {
  kind: KGenerativeKind;
  prompt: string;
  /** What the student compares their paper work against (compare-to-model). */
  model: string | null;
}
export interface KLessonConcept {
  id: string;
  name: string;
  /** `reveal` is the SUBSTANTIAL consolidation studied AFTER the pretest attempt — the
   *  phase where pretesting/productive-failure actually teaches. */
  anchorProblem: { prompt: string; whatToNotice: string | null; reveal: string | null } | null;
  hintLadder: string[];
  workedExample: KWorkedStep[];
  derivation: KDerivationStep[];
  checks: KCheck[];
  calibration: { question: string; modelAnswer: string } | null;
  misconceptions: KMisconception[];
  teachBack: KTeachBack | null;
  /** Varied generative acts (summarize/draw/imagine/self-explain) done on paper. */
  generative: KGenerative[];
}
export interface KInterleaved {
  prompt: string;
  whichConcept: string;
  modelAnswer: string;
}
export interface KSynthesis {
  question: string;
  modelAnswer: string;
}
export interface KSpacing {
  conceptId: string;
  returnAfter: string;
}
export interface KLesson {
  title: string;
  subject: string | null;
  conceptMap: KConceptMap;
  prerequisites: KPrereq[];
  concepts: KLessonConcept[];
  interleaved: KInterleaved[];
  synthesis: KSynthesis[];
  spacing: KSpacing[];
}

export interface KLessonValidation {
  ok: boolean;
  lesson: KLesson | null;
  /** Non-fatal issues — the lesson still plays. */
  warnings: string[];
  /** Sections absent/empty — surfaced so the user can ask the LLM to continue. */
  missing: string[];
}

/* ----------------------------- normalization ----------------------------- */

const MAX = 200_000; // overall sanity cap is enforced by JSON.parse size; per-field below

const s = (v: unknown, max = 20_000): string => {
  if (v === null || v === undefined) return "";
  // Drop non-scalars (objects/arrays) instead of rendering the literal
  // "[object Object]" to the student when the LLM mis-types a field.
  if (typeof v === "object") return "";
  return String(v).trim().slice(0, max);
};
const sOrNull = (v: unknown, max = 20_000): string | null => {
  const t = s(v, max);
  return t ? t : null;
};
const sArr = (v: unknown, maxItems = 50): string[] =>
  (Array.isArray(v) ? v : [])
    .map((x) => s(x))
    .filter((x) => x.length > 0)
    .slice(0, maxItems);

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/* Auto-graded check/prereq normalizers. All default leniently — an unknown or
   missing `format` becomes "open" (the legacy free-text behaviour), which is the
   whole backward-compatibility guarantee: lessons authored before these fields
   existed simply render as they always did. */
const CHECK_FORMATS = new Set(["mcq", "integer", "fillblank", "short", "open"]);
const CHECK_LEVELS = new Set(["fact", "concept", "application"]);
const GEN_KINDS = new Set(["summarize", "draw", "imagine", "selfexplain", "other"]);

const normFormat = (v: unknown): KCheckFormat => {
  const t = s(v).toLowerCase();
  return (CHECK_FORMATS.has(t) ? t : "open") as KCheckFormat;
};
const normLevel = (v: unknown): KCheckLevel | null => {
  const t = s(v).toLowerCase();
  return CHECK_LEVELS.has(t) ? (t as KCheckLevel) : null;
};
const normOptions = (v: unknown): KOption[] =>
  (Array.isArray(v) ? v : [])
    .map((o) => (isObj(o) ? { text: s(o.text, 2_000), correct: o.correct === true, misconception: sOrNull(o.misconception, 2_000) } : null))
    .filter((x): x is KOption => !!x && x.text.length > 0)
    .slice(0, 8);

let autoId = 0;
const idFrom = (v: unknown, name: string): string => {
  const t = s(v, 80);
  if (t) return t;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug) return slug;
  // No id and a non-alphanumeric name: derive a STABLE id from the name so the
  // same concept gets the same id in conceptMap and concepts (the counter is
  // used only for a truly empty name).
  if (!name) return `c${++autoId}`;
  let h = 7;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `c-${h.toString(36)}`;
};

function normConcept(raw: unknown): KLessonConcept | null {
  if (!isObj(raw)) return null;
  const name = s(raw.name, 300) || s(raw.title, 300);
  const id = idFrom(raw.id, name);
  if (!name && !s(raw.anchorProblem) && !Array.isArray(raw.checks)) return null;

  const ap = isObj(raw.anchorProblem) ? raw.anchorProblem : null;
  const anchorProblem = ap && s(ap.prompt)
    ? { prompt: s(ap.prompt, 10_000), whatToNotice: sOrNull(ap.whatToNotice, 4_000), reveal: sOrNull(ap.reveal, 10_000) }
    : null;

  const workedExample: KWorkedStep[] = (Array.isArray(raw.workedExample) ? raw.workedExample : [])
    .map((st) => (isObj(st) ? { text: s(st.text, 10_000), selfExplain: sOrNull(st.selfExplain ?? st.selfExplanation, 2_000) } : null))
    .filter((x): x is KWorkedStep => !!x && x.text.length > 0)
    .slice(0, 30);

  const derivation: KDerivationStep[] = (Array.isArray(raw.derivation) ? raw.derivation : [])
    .map((st) => (isObj(st) ? { prompt: s(st.prompt, 6_000), answer: s(st.answer, 10_000) } : null))
    .filter((x): x is KDerivationStep => !!x && (x.prompt.length > 0 || x.answer.length > 0))
    .slice(0, 30);

  const checks: KCheck[] = (Array.isArray(raw.checks) ? raw.checks : [])
    .map((c) => {
      if (!isObj(c)) return null;
      const question = s(c.question, 10_000);
      if (!question) return null;
      const kind = s(c.kind).toLowerCase() === "transfer" ? "transfer" : "retrieval";
      let format = normFormat(c.format);
      const options = format === "mcq" ? normOptions(c.options) : [];
      // An MCQ with no correct option is ungradeable — fall back to free-text.
      if (format === "mcq" && !options.some((o) => o.correct)) format = "open";
      return {
        kind,
        question,
        modelAnswer: s(c.modelAnswer, 20_000),
        rubric: sArr(c.rubric, 12),
        format,
        level: normLevel(c.level),
        options,
        answer: sOrNull(c.answer, 2_000),
      } as KCheck;
    })
    .filter((x): x is KCheck => !!x)
    .slice(0, 30);

  const misconceptions: KMisconception[] = (Array.isArray(raw.misconceptions) ? raw.misconceptions : [])
    .map((m) => (isObj(m) ? { misconception: s(m.misconception, 4_000), correction: s(m.correction, 10_000) } : null))
    .filter((x): x is KMisconception => !!x && x.misconception.length > 0)
    .slice(0, 20);

  const cal = isObj(raw.calibration) ? raw.calibration : null;
  const calibration = cal && s(cal.question)
    ? { question: s(cal.question, 6_000), modelAnswer: s(cal.modelAnswer, 10_000) }
    : null;

  const tb = isObj(raw.teachBack) ? raw.teachBack : null;
  const teachBack = tb && (s(tb.whatToExplain) || Array.isArray(tb.checklist))
    ? { whatToExplain: s(tb.whatToExplain, 6_000), checklist: sArr(tb.checklist, 20) }
    : null;

  const generative: KGenerative[] = (Array.isArray(raw.generative) ? raw.generative : [])
    .map((g) => {
      if (!isObj(g)) return null;
      const prompt = s(g.prompt, 4_000);
      if (!prompt) return null;
      const k = s(g.kind).toLowerCase();
      return { kind: (GEN_KINDS.has(k) ? k : "other") as KGenerativeKind, prompt, model: sOrNull(g.model, 6_000) };
    })
    .filter((x): x is KGenerative => !!x)
    .slice(0, 12);

  return {
    id,
    name: name || id,
    anchorProblem,
    hintLadder: sArr(raw.hintLadder, 12),
    workedExample,
    derivation,
    checks,
    calibration,
    misconceptions,
    teachBack,
    generative,
  };
}

/** Normalize a parsed lesson object. Never throws. */
export function validateLesson(raw: unknown): KLessonValidation {
  autoId = 0;
  const warnings: string[] = [];
  const missing: string[] = [];
  if (!isObj(raw)) {
    return { ok: false, lesson: null, warnings: [], missing: ["the whole lesson object"] };
  }

  const cmRaw = isObj(raw.conceptMap) ? raw.conceptMap : {};
  const conceptMap: KConceptMap = {
    summary: sOrNull(cmRaw.summary, 4_000),
    concepts: (Array.isArray(cmRaw.concepts) ? cmRaw.concepts : [])
      .map((c) => {
        if (!isObj(c)) return null;
        const name = s(c.name, 300);
        if (!name) return null;
        return { id: idFrom(c.id, name), name, dependsOn: sArr(c.dependsOn, 20) };
      })
      .filter((x): x is KConcept => !!x)
      .slice(0, 60),
  };

  const prerequisites: KPrereq[] = (Array.isArray(raw.prerequisites) ? raw.prerequisites : [])
    .map((p) => {
      if (!isObj(p)) return null;
      const question = s(p.question, 6_000);
      if (!question) return null;
      let format = normFormat(p.format);
      const options = format === "mcq" ? normOptions(p.options) : [];
      if (format === "mcq" && !options.some((o) => o.correct)) format = "open";
      return {
        question,
        modelAnswer: s(p.modelAnswer, 10_000),
        ifShaky: sOrNull(p.ifShaky, 4_000),
        format,
        options,
        answer: sOrNull(p.answer, 2_000),
        refresher: sOrNull(p.refresher, 10_000),
      };
    })
    .filter((x): x is KPrereq => !!x)
    .slice(0, 30);

  const concepts = (Array.isArray(raw.concepts) ? raw.concepts : [])
    .map(normConcept)
    .filter((x): x is KLessonConcept => !!x)
    .slice(0, 40);

  const interleaved: KInterleaved[] = (Array.isArray(raw.interleaved) ? raw.interleaved : [])
    .map((q) => (isObj(q) && s(q.prompt) ? { prompt: s(q.prompt, 10_000), whichConcept: s(q.whichConcept, 300), modelAnswer: s(q.modelAnswer, 20_000) } : null))
    .filter((x): x is KInterleaved => !!x)
    .slice(0, 40);

  const synthesis: KSynthesis[] = (Array.isArray(raw.synthesis) ? raw.synthesis : [])
    .map((q) => (isObj(q) && s(q.question) ? { question: s(q.question, 10_000), modelAnswer: s(q.modelAnswer, 20_000) } : null))
    .filter((x): x is KSynthesis => !!x)
    .slice(0, 20);

  const spacing: KSpacing[] = (Array.isArray(raw.spacing) ? raw.spacing : [])
    .map((sp) => (isObj(sp) && s(sp.conceptId) ? { conceptId: s(sp.conceptId, 80), returnAfter: s(sp.returnAfter, 80) } : null))
    .filter((x): x is KSpacing => !!x)
    .slice(0, 60);

  const lesson: KLesson = {
    title: s(raw.title, 300) || "Untitled lesson",
    subject: sOrNull(raw.subject, 200),
    conceptMap,
    prerequisites,
    concepts,
    interleaved,
    synthesis,
    spacing,
  };

  // Completeness signalling — non-fatal warnings + a "missing" list for continuation.
  if (concepts.length === 0) missing.push("the concepts array (the core of the lesson)");
  if (conceptMap.concepts.length === 0) warnings.push("No concept map was provided — progress will be tracked from the concepts themselves.");
  if (prerequisites.length === 0) warnings.push("No prerequisite checks were provided.");
  if (interleaved.length === 0) warnings.push("No interleaved problem set was provided.");
  if (synthesis.length === 0) warnings.push("No synthesis questions were provided.");
  concepts.forEach((c) => {
    if (!c.anchorProblem && c.checks.length === 0) {
      warnings.push(`Concept "${c.name}" has neither an anchor problem nor a check — it may be thin.`);
    }
  });

  return { ok: concepts.length > 0, lesson, warnings, missing };
}

/** The first balanced {...} or [...] block, respecting JSON string contents so
 *  brackets inside strings or trailing prose don't break extraction. */
function firstBalanced(src: string): string | null {
  const start = src.search(/[[{]/);
  if (start < 0) return null;
  const open = src[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Extract a JSON value from pasted text — tolerates ```json fences and leading
 * prose by grabbing the first balanced {...} block. Mirrors lib/userbank/schema.
 */
export function parseLessonText(
  text: string
): { ok: true; data: unknown } | { ok: false; error: string } {
  let str = (text ?? "").trim();
  if (!str) return { ok: false, error: "Nothing to read — paste the JSON your AI tool produced." };
  if (str.length > MAX) str = str.slice(0, MAX);

  const fence = str.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) str = fence[1].trim();
  // Trim prose before/after the JSON via a balanced-delimiter scan (handles a
  // stray bracket in trailing prose, which the old greedy regex over-captured).
  const block = firstBalanced(str);
  if (block) str = block;

  try {
    return { ok: true, data: JSON.parse(str) };
  } catch {
    return {
      ok: false,
      error:
        "That isn't valid JSON. If the chapter was long, the model may have cut off mid-output — copy the rest and paste it too, or ask it to continue.",
    };
  }
}

/* ====================================================================== */
/* Revision Mode — a tagged, self-scored practice-test bank.              */
/* ====================================================================== */

export interface KRevisionQuestion {
  id: string;
  question: string;
  modelAnswer: string;
  rubric: string[];
  kind: "retrieval" | "transfer";
  topic: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
}
export interface KRevisionBank {
  title: string;
  subject: string | null;
  questions: KRevisionQuestion[];
}
export interface KRevisionValidation {
  ok: boolean;
  bank: KRevisionBank | null;
  warnings: string[];
  missing: string[];
}

const DIFF = new Set(["easy", "medium", "hard"]);

export function validateRevision(raw: unknown): KRevisionValidation {
  autoId = 0;
  // Accept either { questions: [...] } or a bare top-level [...] of questions.
  const list: unknown[] | null = Array.isArray(raw)
    ? raw
    : isObj(raw) && Array.isArray(raw.questions)
    ? (raw.questions as unknown[])
    : null;
  if (!list) return { ok: false, bank: null, warnings: [], missing: ["the questions array"] };
  const obj: Record<string, unknown> = isObj(raw) ? raw : {};

  const questions: KRevisionQuestion[] = list
    .map((q) => {
      if (!isObj(q)) return null;
      const question = s(q.question ?? q.prompt, 10_000);
      if (!question) return null;
      const diff = s(q.difficulty).toLowerCase();
      return {
        id: idFrom(q.id, question.slice(0, 40)),
        question,
        modelAnswer: s(q.modelAnswer ?? q.answer, 20_000),
        rubric: sArr(q.rubric, 12),
        kind: s(q.kind).toLowerCase() === "transfer" ? "transfer" : "retrieval",
        topic: sOrNull(q.topic, 200),
        difficulty: DIFF.has(diff) ? (diff as "easy" | "medium" | "hard") : null,
      } as KRevisionQuestion;
    })
    .filter((x): x is KRevisionQuestion => !!x)
    .slice(0, 500);

  const warnings: string[] = [];
  const missing: string[] = [];
  if (questions.length === 0) missing.push("the questions array");
  if (questions.length > 0 && questions.every((q) => !q.modelAnswer)) {
    warnings.push("No model answers were provided — you won't be able to self-check.");
  }

  return {
    ok: questions.length > 0,
    bank: { title: s(obj.title, 300) || "Revision set", subject: sOrNull(obj.subject, 200), questions },
    warnings,
    missing,
  };
}

/* ====================================================================== */
/* Doubt Mode — one concept attacked through many explanatory methods.    */
/* ====================================================================== */

export type KDoubtMethodKind =
  | "analogy"
  | "first-principles"
  | "worked-example"
  | "edge-cases"
  | "visual"
  | "decomposition"
  | "socratic"
  | "other";

const METHOD_KINDS = new Set<string>([
  "analogy", "first-principles", "worked-example", "edge-cases", "visual", "decomposition", "socratic",
]);

export interface KDoubtMethod {
  kind: KDoubtMethodKind;
  title: string;
  content: string;
}
export interface KDoubt {
  concept: string;
  methods: KDoubtMethod[];
  retrievalCheck: { question: string; modelAnswer: string } | null;
}
export interface KDoubtValidation {
  ok: boolean;
  doubt: KDoubt | null;
  warnings: string[];
  missing: string[];
}

export function validateDoubt(raw: unknown): KDoubtValidation {
  if (!isObj(raw)) return { ok: false, doubt: null, warnings: [], missing: ["the whole object"] };

  const methods: KDoubtMethod[] = (Array.isArray(raw.methods) ? raw.methods : [])
    .map((m) => {
      if (!isObj(m)) return null;
      const content = s(m.content ?? m.text ?? m.explanation, 20_000);
      if (!content) return null;
      const kindRaw = s(m.kind).toLowerCase();
      const kind = (METHOD_KINDS.has(kindRaw) ? kindRaw : "other") as KDoubtMethodKind;
      return { kind, title: s(m.title, 200) || kindLabel(kind), content };
    })
    .filter((x): x is KDoubtMethod => !!x)
    .slice(0, 12);

  const rc = isObj(raw.retrievalCheck) ? raw.retrievalCheck : null;
  const retrievalCheck = rc && s(rc.question) ? { question: s(rc.question, 6_000), modelAnswer: s(rc.modelAnswer, 10_000) } : null;

  const missing: string[] = [];
  if (methods.length === 0) missing.push("the methods array (the explanations)");

  return {
    ok: methods.length > 0,
    doubt: { concept: s(raw.concept, 300) || "This concept", methods, retrievalCheck },
    warnings: methods.length < 3 && methods.length > 0 ? ["Only a couple of explanations came back — you can ask your AI for more angles."] : [],
    missing,
  };
}

export function kindLabel(kind: KDoubtMethodKind): string {
  switch (kind) {
    case "analogy": return "Analogy";
    case "first-principles": return "From first principles";
    case "worked-example": return "Worked example";
    case "edge-cases": return "Edge & contrasting cases";
    case "visual": return "Picture it";
    case "decomposition": return "Broken into pieces";
    case "socratic": return "Questions to find the gap";
    default: return "Another way to see it";
  }
}
