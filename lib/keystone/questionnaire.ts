/**
 * Keystone — the personalization questionnaire (mode-aware).
 *
 * Principle: ask ONLY what the student's own AI can't see (their relationship to
 * the material) and the lesson can't measure. The AI reads the chapter, so we no
 * longer ask subject/topic/length/type; the mode encodes the goal; hint-style and
 * shaky prerequisites are adaptive/measured, not self-reported. What's left for
 * Learn is the one high-leverage input — familiarity — plus optional flavour.
 * Revise adds the exam date. Kept as data so the form UI and the prompt compiler
 * (lib/keystone/prompt.ts) stay in sync.
 */

export type KeystoneAnswers = Record<string, string | string[]>;

export type FieldKind = "single" | "multi" | "scale" | "text";

export interface QField {
  id: string;
  label: string;
  help?: string;
  kind: FieldKind;
  /** For single/multi/scale. */
  options?: { value: string; label: string }[];
  optional?: boolean;
  placeholder?: string;
  /** Only show when this predicate passes. */
  showIf?: (a: KeystoneAnswers) => boolean;
}

export interface QGroup {
  id: string;
  title: string;
  /** One-line note shown under the group title. */
  blurb: string;
  fields: QField[];
}

export type QuestionnaireMode = "learning" | "revision";

/* --------------------------------- groups -------------------------------- */

/** The one input the AI genuinely can't read off the chapter — and the biggest
 *  moderator of how much to scaffold (expertise reversal; knowledge-as-bottleneck). */
const familiarityGroup: QGroup = {
  id: "prior",
  title: "Where you're starting from",
  blurb: "Your prior knowledge with this specific topic is THE biggest factor in how much the lesson scaffolds.",
  fields: [
    {
      id: "familiarity",
      label: "How familiar are you with this specific topic?",
      kind: "single",
      options: [
        { value: "new", label: "Never seen it" },
        { value: "some", label: "Some exposure" },
        { value: "review", label: "Reviewing something I've learned" },
      ],
    },
  ],
};

/** Optional, skippable flavour: an interest for analogies (elaboration) + an
 *  attention/chunking toggle. Never blocks compiling the prompt. */
const flavorGroup: QGroup = {
  id: "flavor",
  title: "Optional — make it yours",
  blurb: "All skippable — these only add flavour. Leave them and go straight to your prompt if you like.",
  fields: [
    {
      id: "interests",
      label: "Draw examples and analogies from… (pick any)",
      kind: "multi",
      optional: true,
      options: [
        { value: "sport", label: "Sport" },
        { value: "music", label: "Music" },
        { value: "cooking", label: "Cooking" },
        { value: "code", label: "Code" },
        { value: "games", label: "Games" },
        { value: "everyday", label: "Everyday life" },
        { value: "nature", label: "Nature" },
        { value: "money", label: "Money & business" },
      ],
    },
    { id: "interestsOther", label: "Anything else you're into?", kind: "text", optional: true, placeholder: "e.g. F1, chess, gardening — or leave blank" },
    {
      id: "attention",
      label: "Design the lesson around attention challenges?",
      kind: "single",
      help: "Shorter rewarded chunks, immediate frequent feedback, low cost-to-start. (Not a 'learning style' — just pacing.)",
      optional: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No / prefer not to say" },
      ],
    },
  ],
};

/** Revise only: the exam date tunes the spaced-return schedule. */
const examGroup: QGroup = {
  id: "exam",
  title: "Your exam",
  blurb: "Sets how your spaced-return schedule is timed.",
  fields: [
    {
      id: "examWhen",
      label: "When is the exam?",
      kind: "single",
      optional: true,
      options: [
        { value: "lt1w", label: "Less than a week" },
        { value: "1to4w", label: "1–4 weeks" },
        { value: "1to3m", label: "1–3 months" },
        { value: "gt3m", label: "More than 3 months" },
      ],
    },
  ],
};

export const LEARN_GROUPS: QGroup[] = [familiarityGroup, flavorGroup];
export const REVISE_GROUPS: QGroup[] = [familiarityGroup, examGroup];

export function groupsFor(mode: QuestionnaireMode): QGroup[] {
  return mode === "revision" ? REVISE_GROUPS : LEARN_GROUPS;
}

/** Fields the student MUST answer before the prompt can be compiled. */
export const REQUIRED_FIELD_IDS = ["familiarity"];

export function isFieldVisible(field: QField, answers: KeystoneAnswers): boolean {
  return field.showIf ? field.showIf(answers) : true;
}

/** Which required+visible fields (for this mode) are still empty. */
export function missingRequired(answers: KeystoneAnswers, mode: QuestionnaireMode = "learning"): string[] {
  const out: string[] = [];
  for (const group of groupsFor(mode)) {
    for (const f of group.fields) {
      if (!REQUIRED_FIELD_IDS.includes(f.id)) continue;
      if (!isFieldVisible(f, answers)) continue;
      const v = answers[f.id];
      const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) out.push(f.id);
    }
  }
  return out;
}

export const str = (a: KeystoneAnswers, id: string): string =>
  (Array.isArray(a[id]) ? (a[id] as string[]).join(", ") : (a[id] as string) || "").trim();

export const arr = (a: KeystoneAnswers, id: string): string[] =>
  Array.isArray(a[id]) ? (a[id] as string[]) : a[id] ? [a[id] as string] : [];
