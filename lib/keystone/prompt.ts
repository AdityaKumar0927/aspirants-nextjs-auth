/**
 * Keystone — the Learning-Mode prompt compiler.
 *
 * Turns questionnaire answers into the single mega-prompt the student runs in
 * their OWN LLM, alongside their OWN chapter (which never touches our servers).
 * The output contract here MUST stay in sync with lib/keystone/schema.ts — the
 * player renders exactly what this prompt asks the model to produce.
 *
 * This is the product's pedagogy: it instructs the model to front-load the
 * adaptivity (anticipate misconceptions, pre-author hint ladders) so a
 * pre-generated lesson can approximate a live tutor.
 */
import { str, arr, type KeystoneAnswers } from "@/lib/keystone/questionnaire";

const NATURE: Record<string, string> = {
  conceptual:
    "This is CONCEPTUAL material — weight first-principles derivation and step-by-step self-explanation heavily; the student must co-produce results, not receive them.",
  procedural:
    "This is PROCEDURAL material — weight worked examples with embedded self-explanation and a rich interleaved problem set where the student must first decide WHICH method applies.",
  factual:
    "This is FACTUAL material — weight retrieval practice and elaboration; still force production (recall + explain) rather than recognition.",
};

const FAMILIARITY: Record<string, string> = {
  new: "The student is seeing this topic for the FIRST time: scaffold generously, give more worked examples and a longer hint ladder, and keep anchor problems approachable (aim for a roughly 85% success rate with hints).",
  some: "The student has SOME exposure: balance struggle and support; anchor problems can be moderately challenging.",
  review: "The student is REVIEWING material they've learned: lean hard into struggle-first and retrieval; keep scaffolding light and let them fail productively before any reveal.",
};

const EXAM_SPACING: Record<string, string> = {
  lt1w: "The exam is LESS THAN A WEEK away — set short spacing gaps (same-day and next-day returns).",
  "1to4w": "The exam is 1–4 WEEKS away — space returns a few days apart.",
  "1to3m": "The exam is 1–3 MONTHS away — space returns about a week apart, widening over time.",
  gt3m: "The exam is MORE THAN 3 MONTHS away — use wide, expanding spacing (1–2 weeks, then longer).",
};

const APPROACH: Record<string, string> = {
  struggle: "The student prefers to wrestle first — make the anchor problem the very first thing for each concept and withhold all teaching until they've genuinely attempted it.",
  taught: "The student prefers to be taught first — still require an anchor attempt (it's how learning works), but keep the hint ladder gentle and reach the worked example quickly.",
};

const EXAMPLES: Record<string, string> = {
  many: "Provide MORE worked examples per concept (2–3 where the material supports it), each with self-explanation prompts.",
  balance: "Provide a balance of worked examples and solve-it-yourself checks.",
  solo: "Lean toward solve-it-yourself: fewer worked examples, more retrieval and transfer checks.",
};

const STUCK: Record<string, string> = {
  nudge: "When building the hint ladder, make the first rungs SMALL nudges; only the last rung approaches the solution. Never give the answer outright.",
  full: "Build a hint ladder that moves from a nudge to a fuller explanation across its rungs, but still never states the final answer outright.",
};

const FOCUS: Record<string, string> = {
  "10": "Keep each concept's loop SHORT and self-contained (the student focuses ~10 minutes at a time); fewer steps per worked example, frequent checks.",
  "25": "Use moderate chunk sizes (~25-minute sittings).",
  "45": "Longer uninterrupted segments are fine (~45+ minutes); you can build deeper multi-step derivations.",
};

export function buildLearningPrompt(a: KeystoneAnswers): string {
  const subject = str(a, "subject") || "the subject";
  const topic = str(a, "topic") || "the topic";
  const interests = [...arr(a, "interests"), str(a, "interestsOther")].filter(Boolean).join(", ");
  const confusions = str(a, "confusions");
  const stuckBefore = str(a, "stuckBefore");
  const shaky = str(a, "shaky");
  const goal = str(a, "goal");
  const attention = str(a, "attention") === "yes";
  const checkpoints = str(a, "checkpoints");

  // Build the personalization directives from the answers.
  const p: string[] = [];
  p.push(NATURE[str(a, "nature")] ?? "");
  p.push(FAMILIARITY[str(a, "familiarity")] ?? "");
  p.push(`Self-rated comfort with ${subject}: ${str(a, "comfort") || "unknown"}/5; level: ${str(a, "level") || "unspecified"}.`);
  p.push(APPROACH[str(a, "approach")] ?? "");
  p.push(EXAMPLES[str(a, "examples")] ?? "");
  p.push(STUCK[str(a, "stuck")] ?? "");
  p.push(FOCUS[str(a, "focus")] ?? "");
  if (checkpoints === "frequent") p.push("The student wants FREQUENT small checkpoints — add more, shorter checks rather than fewer long ones.");
  if (goal === "exam") p.push(EXAM_SPACING[str(a, "examWhen")] ?? "Set sensible expanding spacing in the `spacing` field.");
  else p.push("The goal is deep long-term understanding — use expanding spacing (next day, a few days, a week, two weeks).");
  if (shaky) p.push(`The student flagged these prerequisite areas as shaky: "${shaky}". Make sure the prerequisite checks cover them, and note in ifShaky what to revisit.`);
  if (confusions) p.push(`The student already finds these parts confusing: "${confusions}". PRE-AUTHOR targeted misconception entries and hint rungs for exactly these.`);
  if (stuckBefore) p.push(`Last time they got stuck here: "${stuckBefore}". Address this directly in the relevant concept's misconceptions and hints.`);
  if (interests) p.push(`Draw analogies and example flavor from the student's interests where natural: ${interests}.`);
  if (attention) p.push("Design for attention challenges: keep chunks short with low cost-to-start, give immediate and salient feedback, and make each step feel like a small win — without dumbing the content down.");

  const personalization = p.filter((x) => x.trim()).map((x) => `- ${x}`).join("\n");

  return `You are an expert tutor and learning scientist. Build ONE complete, personalized lesson that helps a student deeply UNDERSTAND a chapter of ${subject} on the topic of "${topic}" — not just memorize it. Base the lesson STRICTLY on the material the user has provided to you in this conversation; do not invent facts beyond it. If the material is long, you may be asked to continue in parts.

The lesson is played back inside an interactive app, so you must return it as a SINGLE JSON object and NOTHING else — no preamble, no commentary, no markdown outside one \`\`\`json code block.

═══════════════════════════════════════════════════════════
PEDAGOGY — how to design this lesson (this is the whole point)
═══════════════════════════════════════════════════════════
Understanding is built by what the STUDENT does, so design for production, not reading. For each concept the app runs this loop, so author every part of it:
1. ANCHOR PROBLEM the student attempts BEFORE any teaching (productive failure — the struggle primes encoding and surfaces what they don't know).
2. A HINT LADDER — progressively more revealing hints, released ONE AT A TIME. Never include the final answer in a hint.
3. A WORKED EXAMPLE whose every step carries a SELF-EXPLANATION prompt asking about the CONTENT ("why does this step follow? what principle is at work?") — never "do you understand?".
4. A FIRST-PRINCIPLES DERIVATION broken into steps the student CO-PRODUCES: each step is a prompt for them to attempt, plus the answer to check against.
5. RETRIEVAL and TRANSFER checks, each with a model answer and a short self-scoring rubric so the student can grade their own production. Include at least one TRANSFER item (an unseen application).
6. A CALIBRATION question (predict-confidence-then-reveal) to fight the fluency illusion.
7. Anticipated MISCONCEPTIONS with pre-written corrections (front-load the adaptivity a live tutor would improvise).
8. A TEACH-BACK spec: what they should be able to explain, and a checklist their explanation must hit.

Then ACROSS the chapter: an INTERLEAVED problem set mixing concepts (the student must first work out WHICH concept applies), and SYNTHESIS questions that connect everything. Plus a concept map (advance organizer) and prerequisite checks up front, and spacing metadata for return.

═══════════════════════════════════════════════════════════
PERSONALIZE FOR THIS STUDENT
═══════════════════════════════════════════════════════════
${personalization}

═══════════════════════════════════════════════════════════
OUTPUT — return EXACTLY this JSON shape (omit a field only if truly N/A)
═══════════════════════════════════════════════════════════
\`\`\`json
{
  "title": "Lesson title",
  "subject": "${subject}",
  "conceptMap": {
    "summary": "2–3 sentences on the big picture of the chapter",
    "concepts": [
      { "id": "short-id", "name": "Concept name", "dependsOn": ["other-concept-id"] }
    ]
  },
  "prerequisites": [
    { "question": "A production question that checks a needed foundation", "modelAnswer": "...", "ifShaky": "What to revisit if they can't answer this" }
  ],
  "concepts": [
    {
      "id": "short-id (matches conceptMap)",
      "name": "Concept name",
      "anchorProblem": { "prompt": "A problem to attempt BEFORE teaching", "whatToNotice": "What the struggle should surface" },
      "hintLadder": ["Nudge", "A bigger steer", "Near-solution but NOT the answer"],
      "workedExample": [
        { "text": "Step shown to the student (Markdown + LaTeX)", "selfExplain": "Why does this step follow?" }
      ],
      "derivation": [
        { "prompt": "Co-produce this step — what comes next and why?", "answer": "The step, to check against" }
      ],
      "checks": [
        { "kind": "retrieval", "question": "...", "modelAnswer": "...", "rubric": ["Point the answer must include", "..."] },
        { "kind": "transfer", "question": "An unseen application", "modelAnswer": "...", "rubric": ["..."] }
      ],
      "calibration": { "question": "A question to predict-then-check confidence on", "modelAnswer": "..." },
      "misconceptions": [
        { "misconception": "A likely wrong idea", "correction": "Why it's wrong and the right idea" }
      ],
      "teachBack": { "whatToExplain": "Explain X as if teaching it", "checklist": ["Must mention …", "Must address misconception …"] }
    }
  ],
  "interleaved": [
    { "prompt": "A mixed problem", "whichConcept": "name of the concept it tests", "modelAnswer": "..." }
  ],
  "synthesis": [
    { "question": "A question connecting the concepts into the bigger picture", "modelAnswer": "..." }
  ],
  "spacing": [
    { "conceptId": "short-id", "returnAfter": "e.g. 1 day / 3 days / 1 week" }
  ]
}
\`\`\`

RULES:
- Use one concept per distinct idea in the chapter; order them so prerequisites come first.
- Write all math in LaTeX: inline $...$ and display $$...$$. Use Markdown for emphasis, lists, and tables.
- NO IMAGES or image links. If a diagram matters, DESCRIBE it in words or ASCII.
- Keep every "id" short, lowercase, hyphenated, and consistent between conceptMap and concepts.
- BEFORE you answer, silently CHECK YOUR OWN WORK: verify every model answer is correct, every derivation step is valid, and the JSON is complete and parseable.
- Return ONLY the single \`\`\`json code block — no text before or after it.

The student's material follows below.
---
[PASTE YOUR CHAPTER / NOTES / PDF TEXT HERE]`;
}
