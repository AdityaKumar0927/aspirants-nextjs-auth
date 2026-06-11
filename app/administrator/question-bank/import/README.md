# PDF → Question Bank import

Admin-only pipeline that turns a question-paper PDF into reviewable draft
questions. Reached from the question bank's **Import from PDF** button
(`/administrator/question-bank/import`).

## Pipeline

1. **Render + extract (browser, `pdf-utils.ts`).** For each page pdf.js produces
   three things:
   - a **page image** (JPEG) — visual truth for math/layout,
   - the **text layer** in reading order (`getTextContent`) — exact prose,
   - **figure rectangles** computed from the PDF operator list by tracking the
     CTM (`save`/`restore`/`transform` → `paintImageXObject`), then cropped from
     the rendered canvas. Geometry comes from the PDF itself, not from the LLM.

2. **Extract (`POST /api/import/extract`, admin).** Pages are sent in
   overlapping 3-page batches. The model receives each page's image + text layer
   + the list of figure ids, and returns typed questions (MCQ / Multiple Correct
   / Integer / Numerical / Subjective) as Markdown + LaTeX, associating figures
   by **id** (never by invented coordinates). An optional pasted answer key is
   reconciled here. Output is a strict JSON schema, re-validated with Zod.

3. **Review (`ImportWizard.tsx`).** Every question is editable: KaTeX preview,
   type switch, option/answer editors, passage editing, and figure attach/detach
   from the page's detected-figure tray. Live validation uses the same
   `lib/validations/question.ts` schema the server enforces.

4. **Import.** Attached figures upload via `POST /api/import/diagram`
   (magic-byte validated), then `POST /api/questions/bulk` inserts everything as
   **DRAFT** with an `ImportJob` audit row. Drafts never go live without review.

## Worker asset

`renderAndExtract` sets `GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"`.
That file is a manual copy of `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
into `public/`. **Re-copy it whenever pdfjs-dist is upgraded** — bundling it via
`new URL(...)` breaks `next build` (Terser can't minify the ESM worker).

## Env

- AI provider is resolved by `lib/ai.ts` (see `.env.example`). Set **one** of:
  - `GEMINI_API_KEY` (+ optional `GEMINI_EXTRACTION_MODEL`, default
    `gemini-2.5-flash`) — the default/free path, or
  - `OPENAI_API_KEY` (+ optional `OPENAI_EXTRACTION_MODEL`, default `gpt-4o`) —
    used as the automatic fallback.
  - `AI_PROVIDER` (`auto`|`gemini`|`groq`|`openai`, default `auto`) pins the
    order. Groq is **not** used for extraction (no vision model).
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` enable per-admin rate limiting (extract +
  diagram); absent in dev → limiting is skipped.
