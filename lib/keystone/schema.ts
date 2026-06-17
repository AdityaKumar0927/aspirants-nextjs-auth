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
}
export interface KWorkedStep {
  text: string;
  selfExplain: string | null;
}
export interface KDerivationStep {
  prompt: string;
  answer: string;
}
export interface KCheck {
  kind: "retrieval" | "transfer";
  question: string;
  modelAnswer: string;
  rubric: string[];
}
export interface KMisconception {
  misconception: string;
  correction: string;
}
export interface KTeachBack {
  whatToExplain: string;
  checklist: string[];
}
export interface KLessonConcept {
  id: string;
  name: string;
  anchorProblem: { prompt: string; whatToNotice: string | null } | null;
  hintLadder: string[];
  workedExample: KWorkedStep[];
  derivation: KDerivationStep[];
  checks: KCheck[];
  calibration: { question: string; modelAnswer: string } | null;
  misconceptions: KMisconception[];
  teachBack: KTeachBack | null;
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

let autoId = 0;
const idFrom = (v: unknown, name: string): string => {
  const t = s(v, 80);
  if (t) return t;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `c${++autoId}`;
};

function normConcept(raw: unknown): KLessonConcept | null {
  if (!isObj(raw)) return null;
  const name = s(raw.name, 300) || s(raw.title, 300);
  const id = idFrom(raw.id, name);
  if (!name && !s(raw.anchorProblem) && !Array.isArray(raw.checks)) return null;

  const ap = isObj(raw.anchorProblem) ? raw.anchorProblem : null;
  const anchorProblem = ap && s(ap.prompt)
    ? { prompt: s(ap.prompt, 10_000), whatToNotice: sOrNull(ap.whatToNotice, 4_000) }
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
      return { kind, question, modelAnswer: s(c.modelAnswer, 20_000), rubric: sArr(c.rubric, 12) } as KCheck;
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
      return { question, modelAnswer: s(p.modelAnswer, 10_000), ifShaky: sOrNull(p.ifShaky, 4_000) };
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
  if (!/^[[{]/.test(str)) {
    const m = str.match(/[[{][\s\S]*[\]}]/);
    if (m) str = m[0];
  }

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
