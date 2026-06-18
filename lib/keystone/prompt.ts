/**
 * Keystone — the Learning-Mode prompt compiler.
 *
 * Turns questionnaire answers into the single mega-prompt the student runs in
 * their OWN LLM, alongside their OWN chapter (which never touches our servers).
 * The output contract here MUST stay in sync with lib/keystone/schema.ts — the
 * player renders exactly what this prompt asks the model to produce.
 *
 * Design principle: ask the student only what the AI CAN'T see (their relationship
 * to the material) and let the AI infer everything visible in the chapter. Depth
 * of scaffolding is authored from `familiarity`; the player adapts further on live
 * performance. This is the product's pedagogy — front-loaded adaptivity so a
 * pre-generated lesson can approximate a live tutor.
 */
import { str, arr, type KeystoneAnswers } from "@/lib/keystone/questionnaire";

const FAMILIARITY: Record<string, string> = {
  new: "The student is seeing this topic for the FIRST time: scaffold generously — fuller worked examples, a longer hint ladder, and approachable pretests (aim for a roughly 85% success rate WITH hints). Lead with the worked example before pushing independence.",
  some: "The student has SOME exposure: balance struggle and support; pretests can be moderately challenging and worked examples can be a little terser.",
  review: "The student is REVIEWING material they've learned: lean hard into struggle-first and retrieval; keep scaffolding light, withhold worked steps longer, and let them fail productively before any reveal.",
};

const EXAM_SPACING: Record<string, string> = {
  lt1w: "The exam is LESS THAN A WEEK away — set short spacing gaps (same-day and next-day returns).",
  "1to4w": "The exam is 1–4 WEEKS away — space returns a few days apart.",
  "1to3m": "The exam is 1–3 MONTHS away — space returns about a week apart, widening over time.",
  gt3m: "The exam is MORE THAN 3 MONTHS away — use wide, expanding spacing (1–2 weeks, then longer).",
};

export function buildLearningPrompt(a: KeystoneAnswers): string {
  const interests = [...arr(a, "interests"), str(a, "interestsOther")].filter(Boolean).join(", ");
  const attention = str(a, "attention") === "yes";

  // Personalize ONLY from things the AI can't read off the chapter: the student's
  // relationship to the material. Familiarity drives scaffolding depth.
  const p: string[] = [];
  p.push(FAMILIARITY[str(a, "familiarity")] ?? FAMILIARITY.some);
  if (interests) p.push(`Draw analogies and example flavour from the student's interests where it's genuinely natural: ${interests}.`);
  if (attention)
    p.push("Design for attention challenges: keep each concept's loop short with a low cost-to-start, give immediate and salient feedback, and make each step a small win — without dumbing down the content.");
  const personalization = p.filter((x) => x.trim()).map((x) => `- ${x}`).join("\n");

  return `You are an expert tutor and learning scientist. Build ONE complete, personalized lesson that helps a student deeply UNDERSTAND the material they provide below — not just memorize it. READ THE MATERIAL to determine its subject, topic, scope, and type YOURSELF; the student was not asked for them. Base the lesson STRICTLY on that material; do not invent facts beyond it. If it is long, you may be asked to continue in parts.

The lesson plays inside an interactive app across TWO surfaces: the student THINKS on their own paper/tablet, and the app prompts each generative act, then captures only a committable ANSWER plus a CONFIDENCE rating and auto-grades it. So: pose problems to be worked ON PAPER, and make every CHECK auto-gradable (multiple-choice / integer / fill-in-the-blank). Reserve free text only where a rubric self-check is genuinely the only option.

Return a SINGLE JSON object and NOTHING else — no preamble, no commentary, no markdown outside one \`\`\`json code block.

═══════════════════════════════════════════════════════════
PEDAGOGY — the science this lesson must apply
═══════════════════════════════════════════════════════════
Understanding is built by what the STUDENT produces — but the learning LANDS in the instruction that FOLLOWS their attempt. So make the teaching substantial and the checks frictionless. For each concept the app runs this loop; author every part:

1. PRETEST (anchorProblem). A genuinely hard problem to attempt BEFORE any teaching. Frame it as low-stakes — getting it wrong is expected and is the point (the failed attempt primes encoding). CRUCIAL: give a SUBSTANTIAL \`reveal\` studied AFTER the attempt — full worked consolidation that names the principle and addresses the most likely wrong answers ("if you got X, you probably did Y"). A one-line reveal BREAKS the mechanism — this is where pretesting actually teaches.
2. HINT LADDER — progressively more revealing hints, released one at a time; never the final answer.
3. WORKED EXAMPLE — fully reasoned. EVERY step must state WHY it follows (the principle at work), not just the algebra. Each step also carries a self-explanation prompt about the CONTENT ("why does this step follow?"), never "do you understand?".
4. GENERATIVE acts (1–3) done on the student's OWN paper — choose from: summarize (one-sentence gist), draw (a sketch/diagram, described in words), imagine (predict what happens before reading on), selfexplain (explain a step aloud). Give each a \`model\` to compare their paper work against.
5. DERIVATION from first principles, in steps the student CO-PRODUCES (a prompt to attempt + the answer to check against).
6. CHECKS — AUTO-GRADED and at the RIGHT LEVEL. Each check has a \`format\` and a \`level\`:
   • \`level\`: "fact" (definition/recall), "concept", or "application" (transfer to an unseen case). Fact-quizzing does NOT build higher-order skill — so the CONCEPTUAL checks must be "application" level (a transfer problem, or "which principle applies and why"), NOT fact recognition.
   • \`format\`: one of "mcq" | "integer" | "fillblank" | "short" | "open".
     – "mcq": 3–5 \`options\`, EXACTLY ONE with "correct": true. Every distractor must be COMPETITIVE and DIAGNOSTIC — each maps to a specific likely misconception, named in its "misconception" field (no obvious throwaways). A good MCQ is a retrieval event AND a misconception probe.
     – "integer": a numeric answer in \`answer\`.
     – "fillblank": put a ___ in the question; the canonical fill in \`answer\`.
     – "short": a few-word exact answer in \`answer\`.
     – "open": free text the student self-scores against \`rubric\` — only when it genuinely can't be auto-graded.
   Include at least one "application"-level check per concept (prefer integer/short for real production; use MCQ only with conceptual-trap distractors).
7. MISCONCEPTIONS with pre-written corrections.
8. TEACH-BACK spec: what they should explain + a checklist it must hit.
(The app handles confidence calibration itself — it asks the student to predict before the checks and compares to how they actually do, so you don't author a separate calibration question.)

Across the chapter: PREREQUISITE checks up front, an INTERLEAVED set mixing concepts (name WHICH applies first), SYNTHESIS questions, a concept map (advance organizer), and spacing metadata.

PREREQUISITES ARE A DIAGNOSTIC GATE — not self-report. Make each prerequisite AUTO-GRADED (same \`format\`/\`options\`/\`answer\` as a check, fact level) so the app MEASURES whether the foundation is there. Give each a \`refresher\`: a short worked re-teach shown ONLY if the student gets it wrong (then they re-check). You cannot build understanding on missing foundations.

═══════════════════════════════════════════════════════════
PERSONALIZE FOR THIS STUDENT (their relationship to the material — invisible in the text)
═══════════════════════════════════════════════════════════
${personalization}
- Use expanding spacing for return (next day, a few days, a week, two weeks) in the \`spacing\` field.

═══════════════════════════════════════════════════════════
OUTPUT — return EXACTLY this JSON shape (the default \`format\` is "open"; omit a field only if truly N/A)
═══════════════════════════════════════════════════════════
\`\`\`json
{
  "title": "Lesson title",
  "subject": "Infer the subject from the material",
  "conceptMap": {
    "summary": "2–3 sentences on the big picture of the chapter",
    "concepts": [ { "id": "short-id", "name": "Concept name", "dependsOn": ["other-concept-id"] } ]
  },
  "prerequisites": [
    {
      "question": "A foundation check (auto-graded)",
      "format": "mcq",
      "options": [
        { "text": "the correct option", "correct": true, "misconception": null },
        { "text": "a tempting wrong option", "correct": false, "misconception": "the misconception it reveals" }
      ],
      "answer": null,
      "modelAnswer": "The correct answer, explained",
      "refresher": "A short worked re-teach, shown only if they get it wrong",
      "ifShaky": "What to revisit if this is shaky"
    }
  ],
  "concepts": [
    {
      "id": "short-id (matches conceptMap)",
      "name": "Concept name",
      "anchorProblem": {
        "prompt": "A hard PRETEST to attempt on paper before any teaching (getting it wrong is expected)",
        "whatToNotice": "What the struggle should surface",
        "reveal": "SUBSTANTIAL consolidation studied AFTER the attempt: full working + the principle + the likely wrong answers"
      },
      "hintLadder": ["Nudge", "A bigger steer", "Near-solution but NOT the answer"],
      "workedExample": [
        { "text": "Step shown to the student, stating WHY it follows (the principle) — Markdown + LaTeX", "selfExplain": "Why does this step follow?" }
      ],
      "generative": [
        { "kind": "summarize", "prompt": "On your paper, summarize ... in one sentence", "model": "A model summary to compare against" },
        { "kind": "draw", "prompt": "Sketch ... on your paper", "model": "What a correct sketch shows" }
      ],
      "derivation": [
        { "prompt": "Co-produce this step — what comes next and why?", "answer": "The step, to check against" }
      ],
      "checks": [
        { "kind": "retrieval", "format": "mcq", "level": "fact", "question": "...",
          "options": [ { "text": "correct", "correct": true, "misconception": null },
                       { "text": "tempting trap", "correct": false, "misconception": "the misconception" } ],
          "answer": null, "modelAnswer": "...", "rubric": ["Point the answer must include"] },
        { "kind": "transfer", "format": "integer", "level": "application",
          "question": "An unseen application — work it on paper, then enter the number",
          "options": [], "answer": "42", "modelAnswer": "...", "rubric": ["..."] }
      ],
      "misconceptions": [ { "misconception": "A likely wrong idea", "correction": "Why it's wrong and the right idea" } ],
      "teachBack": { "whatToExplain": "Explain X as if teaching it", "checklist": ["Must mention …", "Must address misconception …"] }
    }
  ],
  "interleaved": [ { "prompt": "A mixed problem", "whichConcept": "name of the concept it tests", "modelAnswer": "..." } ],
  "synthesis": [ { "question": "A question connecting the concepts into the bigger picture", "modelAnswer": "..." } ],
  "spacing": [ { "conceptId": "short-id", "returnAfter": "e.g. 1 day / 3 days / 1 week" } ]
}
\`\`\`

RULES:
- Infer and fill \`subject\` from the material.
- One concept per distinct idea; order them so prerequisites come first.
- Math in LaTeX: inline $...$ and display $$...$$. Markdown for emphasis, lists, tables.
- NO IMAGES or image links. If a diagram matters, DESCRIBE it in words or ASCII.
- Keep every "id" short, lowercase, hyphenated, consistent between conceptMap and concepts.
- For every "mcq", EXACTLY ONE option has "correct": true and every wrong option has a real "misconception".
- BEFORE you answer, silently CHECK YOUR OWN WORK: every model answer and every \`answer\` is correct, every derivation step is valid, every MCQ has exactly one correct option, and the JSON is complete and parseable.
- Return ONLY the single \`\`\`json code block — no text before or after it.

The student's material follows below.
---
[PASTE YOUR CHAPTER / NOTES / PDF TEXT HERE]`;
}

/* ====================================================================== */
/* Revision Mode — an exam-ready, self-scored, interleaved practice bank.  */
/* ====================================================================== */

export function buildRevisionPrompt(a: KeystoneAnswers): string {
  const spacing = EXAM_SPACING[str(a, "examWhen")] ?? "";

  return `You are an expert exam coach. The student has ALREADY learned this material and now needs to make it exam-ready and durable through retrieval practice. READ THE MATERIAL the student provides below to determine its subject and topics YOURSELF. Build a large, INTERLEAVED bank of practice questions based STRICTLY on that material.

The app turns this into a self-scored practice-testing session that prioritizes the student's weak and overconfident items and brings them back on a spaced schedule. So:
- Make MANY questions (as many as the material supports — aim high; the more the better).
- Favor RETRIEVAL (recall/produce) and TRANSFER (apply to an unseen case) questions — the highest-utility revision activity. No recognition-only / true-false trivia.
- INTERLEAVE topics: do not group all questions on one sub-topic together; mix them, because choosing the method is the hard part of a real exam.
- Tag every question with its topic and a difficulty, so the app can prioritize.
- Give every question a model answer and a short self-scoring rubric.
${spacing ? `- ${spacing}\n` : ""}
Return a SINGLE JSON object and NOTHING else (no preamble, no text outside one \`\`\`json block):
\`\`\`json
{
  "title": "Revision set title",
  "subject": "Infer the subject from the material",
  "questions": [
    {
      "id": "q1",
      "kind": "retrieval",
      "question": "A question the student must PRODUCE an answer to (Markdown + LaTeX).",
      "modelAnswer": "The full correct answer to self-check against.",
      "rubric": ["Point the answer must include", "Another point"],
      "topic": "Sub-topic this tests",
      "difficulty": "medium"
    }
  ]
}
\`\`\`

RULES:
- "kind" is "retrieval" or "transfer". "difficulty" is "easy", "medium", or "hard".
- Math in LaTeX ($...$ / $$...$$). Markdown for structure. NO images.
- Before answering, verify every model answer is correct and the JSON is complete and parseable.
- Return ONLY the JSON code block.

The student's material follows below.
---
[PASTE YOUR CHAPTER / NOTES / PDF TEXT HERE]`;
}

/* ====================================================================== */
/* Doubt Mode — one concept, attacked from many angles.                   */
/* ====================================================================== */

export interface DoubtInput {
  concept: string;
  confusion: string;
  interests?: string;
  level?: string;
}

export function buildDoubtPrompt(input: DoubtInput): string {
  const { concept, confusion, interests, level } = input;
  return `A student is STUCK on a single concept and needs it explained until it clicks. Explain "${concept}" through MANY genuinely different methods — not the same explanation reworded. ${
    confusion ? `What specifically confuses them: "${confusion}". Target this.` : ""
  } ${level ? `Their level: ${level}.` : ""}

Produce these methods (skip one only if truly inapplicable), each as a distinct entry:
- analogy: a plain-language analogy${interests ? `, tied to the student's interests where natural (${interests})` : ""}.
- first-principles: build the idea up from its simplest prerequisite.
- worked-example: a concrete worked example showing it in action.
- edge-cases: contrasting and boundary cases that sharpen where the idea does and doesn't apply.
- visual: describe a picture/diagram/mental image of it in words (no image links).
- decomposition: break it into the smallest prerequisite pieces.
- socratic: 3–5 questions that probe where the misunderstanding likely sits.

Return a SINGLE JSON object and NOTHING else (no text outside one \`\`\`json block):
\`\`\`json
{
  "concept": "${concept}",
  "methods": [
    { "kind": "analogy", "title": "Short title", "content": "The explanation (Markdown + LaTeX)." }
  ],
  "retrievalCheck": { "question": "A quick question to confirm it clicked", "modelAnswer": "..." }
}
\`\`\`

RULES:
- "kind" must be one of: analogy, first-principles, worked-example, edge-cases, visual, decomposition, socratic.
- Math in LaTeX. Markdown for structure. NO image links.
- Verify your own work; return ONLY the JSON code block.

If any of the student's own material is relevant, it follows below (optional).
---
[OPTIONAL: PASTE RELEVANT NOTES HERE — or delete this line]`;
}

/** The iterative re-prompt: a DEEPER follow-up after the first round didn't land. */
export function buildDoubtFollowupPrompt(params: {
  concept: string;
  confusion: string;
  triedMethods: string[];
  stillConfusing: string;
}): string {
  const { concept, confusion, triedMethods, stillConfusing } = params;
  return `You earlier explained "${concept}" several ways and it still hasn't clicked for the student. ${
    confusion ? `Their original confusion: "${confusion}". ` : ""
  }These approaches did NOT land: ${triedMethods.join(", ") || "the earlier ones"}. What's STILL confusing them now: "${stillConfusing}".

Go DEEPER and DIFFERENT. Diagnose the most likely root misunderstanding behind "${stillConfusing}", then explain from there with FRESH methods you didn't use before — a different analogy, a more granular decomposition, a different starting point. Be concrete and patient.

Return the SAME single JSON shape as before (concept, methods[], retrievalCheck) and NOTHING else — only one \`\`\`json code block. Math in LaTeX, no image links, verify your own work.`;
}
