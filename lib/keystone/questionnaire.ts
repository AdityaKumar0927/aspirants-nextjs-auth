/**
 * Keystone — the personalization questionnaire.
 *
 * This is the ONLY thing that personalizes a lesson: its answers are compiled
 * (lib/keystone/prompt.ts) into the mega-prompt the student runs in their own
 * LLM. Every group maps to a piece of the learning science (see the `why` on
 * each group). Kept as data so the form UI and the prompt compiler stay in sync.
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
  /** Only show when this predicate passes (e.g. exam date only if goal=exam). */
  showIf?: (a: KeystoneAnswers) => boolean;
}

export interface QGroup {
  id: string;
  title: string;
  /** One-line note shown under the group title. */
  blurb: string;
  fields: QField[];
}

const scale5 = [
  { value: "1", label: "1 — not at all" },
  { value: "2", label: "2" },
  { value: "3", label: "3 — somewhat" },
  { value: "4", label: "4" },
  { value: "5", label: "5 — very" },
];

export const QUESTIONNAIRE: QGroup[] = [
  {
    id: "material",
    title: "Your material",
    blurb: "What you're studying — so the lesson is built on the right kind of content.",
    fields: [
      { id: "subject", label: "Subject or course", kind: "text", placeholder: "e.g. Physics, Organic Chemistry, Microeconomics" },
      { id: "topic", label: "Chapter or topic", kind: "text", placeholder: "e.g. Rotational Dynamics" },
      {
        id: "length", label: "Roughly how long is it?", kind: "single",
        options: [
          { value: "short", label: "A few pages" },
          { value: "medium", label: "One chapter" },
          { value: "long", label: "Several chapters" },
        ],
      },
      {
        id: "materialType", label: "What kind of material?", kind: "single",
        options: [
          { value: "textbook", label: "Textbook" },
          { value: "notes", label: "Lecture notes" },
          { value: "slides", label: "Slides" },
          { value: "paper", label: "Paper" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "nature", label: "Is it mainly…", kind: "single",
        help: "This decides which techniques the lesson leans on.",
        options: [
          { value: "conceptual", label: "Conceptual — theory & derivations" },
          { value: "procedural", label: "Procedural — problem-solving & methods" },
          { value: "factual", label: "Factual — terminology & facts" },
        ],
      },
    ],
  },
  {
    id: "prior",
    title: "Where you're starting from",
    blurb: "Prior knowledge is the biggest factor in how much to scaffold.",
    fields: [
      {
        id: "level", label: "Education level", kind: "single",
        options: [
          { value: "school", label: "School" },
          { value: "undergrad", label: "Undergraduate" },
          { value: "postgrad", label: "Postgraduate" },
          { value: "selfstudy", label: "Self-study" },
        ],
      },
      {
        id: "familiarity", label: "How familiar are you with this specific topic?", kind: "single",
        options: [
          { value: "new", label: "Never seen it" },
          { value: "some", label: "Some exposure" },
          { value: "review", label: "Reviewing something I've learned" },
        ],
      },
      { id: "comfort", label: "Overall comfort with the subject", kind: "scale", options: scale5 },
      { id: "shaky", label: "Any prerequisite areas that feel shaky?", kind: "text", optional: true, placeholder: "e.g. vectors, integration by parts — or leave blank" },
    ],
  },
  {
    id: "goal",
    title: "Your goal",
    blurb: "This routes you to the right mode and sets the spacing schedule.",
    fields: [
      {
        id: "goal", label: "What are you trying to do?", kind: "single",
        options: [
          { value: "understand", label: "Understand deeply, for the long term" },
          { value: "exam", label: "Prepare for a specific exam" },
          { value: "doubt", label: "Clear a specific confusion" },
        ],
      },
      {
        id: "examWhen", label: "When is the exam?", kind: "single",
        showIf: (a) => a.goal === "exam",
        options: [
          { value: "lt1w", label: "Less than a week" },
          { value: "1to4w", label: "1–4 weeks" },
          { value: "1to3m", label: "1–3 months" },
          { value: "gt3m", label: "More than 3 months" },
        ],
      },
    ],
  },
  {
    id: "difficulty",
    title: "How you like to learn",
    blurb: "It nudges everyone toward productive struggle, but tunes the support to you.",
    fields: [
      {
        id: "approach", label: "When you meet something new, you'd rather…", kind: "single",
        options: [
          { value: "struggle", label: "Wrestle with a problem first, then be taught" },
          { value: "taught", label: "Be taught first, then practice" },
        ],
      },
      {
        id: "examples", label: "Worked examples vs. solving yourself", kind: "single",
        options: [
          { value: "many", label: "Lots of worked examples" },
          { value: "balance", label: "A balance" },
          { value: "solo", label: "Mostly solve on my own" },
        ],
      },
      {
        id: "stuck", label: "When you're stuck, you want…", kind: "single",
        options: [
          { value: "nudge", label: "A small nudge" },
          { value: "full", label: "A fuller explanation" },
        ],
      },
    ],
  },
  {
    id: "weak",
    title: "Known weak spots",
    blurb: "So the lesson pre-loads help exactly where you're likely to need it.",
    fields: [
      { id: "confusions", label: "Parts of this topic you already know confuse you?", kind: "text", optional: true, placeholder: "Describe them — or leave blank" },
      { id: "stuckBefore", label: "Tried to learn this before and got stuck somewhere?", kind: "text", optional: true, placeholder: "Where did it break down? — or leave blank" },
    ],
  },
  {
    id: "style",
    title: "Working style",
    blurb: "Sets chunk length and how often you get checkpoints.",
    fields: [
      {
        id: "focus", label: "How long can you focus comfortably in one sitting?", kind: "single",
        options: [
          { value: "10", label: "~10 minutes" },
          { value: "25", label: "~25 minutes" },
          { value: "45", label: "45 minutes or more" },
        ],
      },
      {
        id: "checkpoints", label: "You prefer…", kind: "single",
        options: [
          { value: "frequent", label: "Frequent small checkpoints" },
          { value: "longer", label: "Longer uninterrupted segments" },
        ],
      },
      {
        id: "attention", label: "Want the lesson designed around attention challenges?", kind: "single",
        help: "Shorter rewarded chunks, immediate frequent feedback, low cost-to-start. (Not a 'learning style' — just pacing.)",
        optional: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No / prefer not to say" },
        ],
      },
    ],
  },
  {
    id: "anchors",
    title: "Anchors for analogy",
    blurb: "New ideas stick when tied to things you already know and care about.",
    fields: [
      {
        id: "interests", label: "Draw examples and analogies from… (pick any)", kind: "multi", optional: true,
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
    ],
  },
];

/** Fields the student MUST answer before the prompt can be compiled. */
export const REQUIRED_FIELD_IDS = [
  "subject", "topic", "length", "materialType", "nature",
  "level", "familiarity", "comfort",
  "goal", "approach", "examples", "stuck",
  "focus", "checkpoints",
];

export function isFieldVisible(field: QField, answers: KeystoneAnswers): boolean {
  return field.showIf ? field.showIf(answers) : true;
}

/** Which required+visible fields are still empty. */
export function missingRequired(answers: KeystoneAnswers): string[] {
  const out: string[] = [];
  for (const group of QUESTIONNAIRE) {
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
