/**
 * The copy-paste prompt a student runs in their own AI tool (ChatGPT / Claude /
 * Gemini) together with their study material. Its output is JSON matching the
 * contract in lib/userbank/schema.ts, which we then validate and turn into a
 * private question bank. Keeping the prompt here (not inlined in the UI) means
 * the schema and the prompt that produces it stay in sync.
 */
export function buildImportPrompt(): string {
  return `You are helping a student turn their study material into practice questions.

I will give you study material (notes, a textbook chapter, a PDF's text, etc.).
Create high-quality exam-style questions based STRICTLY on that material, then
return them as a single JSON object in ONE \`\`\`json code block — and nothing
else before or after it.

OUTPUT FORMAT (return exactly this shape):
\`\`\`json
{
  "title": "A short title for this set",
  "description": "One line on what it covers (optional)",
  "questions": [
    {
      "text": "The question. Markdown is allowed.",
      "type": "Multiple Choice",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctOption": "A",
      "correctOptions": [],
      "answerText": null,
      "answerMin": null,
      "answerMax": null,
      "explanation": "Short note on why the answer is correct (optional).",
      "hints": [
        "A gentle nudge toward the relevant idea — don't give it away.",
        "A more specific hint.",
        "A final hint that almost gets them there."
      ],
      "markscheme": {
        "concept": "The key principle or definition being tested.",
        "approach": "How to think about it — the strategy, before any numbers.",
        "solution": "The full worked solution, step by step, ending at the answer.",
        "commonMistakes": "The typical errors students make on this."
      },
      "subject": "e.g. Physics",
      "topic": "e.g. Thermodynamics",
      "difficulty": "easy",
      "marks": 4,
      "negMarks": 1
    }
  ]
}
\`\`\`

QUESTION TYPES — set "type" to exactly one of these and fill the matching answer field(s):
- "Multiple Choice": exactly one correct option. Put 2–6 choices in "options" and the
  correct one's LETTER in "correctOption" ("A" = first option, "B" = second, ...).
- "Multiple Correct": one OR MORE correct options. Use "options" and list every correct
  LETTER in "correctOptions", e.g. ["A","C"].
- "Integer": the answer is a whole number. Put it (as a string) in "answerText", e.g. "42".
- "Numerical": a decimal answer. Either an exact value in "answerText" (e.g. "4.5"), or an
  accepted range via "answerMin" and "answerMax" (e.g. 4.4 and 4.6).
- "Fill Blanks": a short text/numeric answer in "answerText". For multiple accepted answers
  separate them with commas; for a numeric range write "4.7 to 4.9".
- "Subjective": a written/long answer. Put a model answer in "answerText" (optional).

RULES:
- Base every question and answer ONLY on the material provided. Do not invent facts.
- For non-multiple-choice types, leave "options" as [] and "correctOption"/"correctOptions" empty.
- MATH: write all math in LaTeX — inline as $...$ and display as $$...$$ (e.g. $E = mc^2$).
- NO IMAGES: do not reference or link images. If a diagram is needed, DESCRIBE it in words,
  or draw it with ASCII art, or give TikZ code inside the text — never an image URL.
- Use Markdown for emphasis, lists, and tables where helpful.
- "difficulty" should be one of: easy, medium, hard.
- HINTS (recommended): add a "hints" array of 1–4 short hints, ordered from a gentle nudge to
  almost-the-answer. They are revealed ONE AT A TIME during practice, so each should add a little.
- ELABORATE MARKSCHEME (strongly recommended — this is the point): make "markscheme" an OBJECT
  with these optional sections — "concept" (the principle/idea being tested), "approach" (how to
  think about it, before any numbers), "solution" (the full worked steps, ending at the answer),
  and "commonMistakes". Teach the idea, don't just state the answer. (A plain "markscheme" string
  still works if you'd rather write one block.)
- "marks"/"negMarks" are optional; include them if the material implies a scheme.
- Aim for a good mix of types and difficulties. Make as many questions as the material supports.
- Return ONLY the JSON code block. No commentary, no explanation outside the JSON.

My study material follows below:
---
[PASTE YOUR NOTES / CHAPTER / PDF TEXT HERE]`;
}
