# Keystone — Spec & Handoff

> A self-contained brief for continuing this feature in a fresh session.
> Source of truth for *behaviour* is the code; this is the map, the decisions, and the backlog.

---

## 1. What it is

**Keystone** is a no-API-key "understanding engine" living at **`/keystone`** inside the penwise app.
The site **never calls an LLM and holds no key**. The model is a three-part loop:

1. **Prompt Compiler (site)** — a questionnaire + mode → a precise, personalized mega-prompt (the pedagogy IP).
2. **Content Engine (the student's own LLM)** — they run the prompt in ChatGPT/Claude/Gemini with **their own chapter** and get back **one JSON object**.
3. **Lesson Player (site)** — they paste that JSON back; the site validates it and plays it as an interactive, evidence-based lesson.

Consequences: zero AI cost/liability for us; the student's copyrighted material never touches our servers; the moat is the pedagogy in the prompt + the experience in the player.

**Three modes:** Learn a chapter · Revise for an exam · Clear a doubt.
**The shelf:** saved lessons/sets with cross-session **spaced-return scheduling** (localStorage), optionally **synced to the DB across devices** when signed in.

The full product brief the user supplied (the "Understanding Engine — Master Brief") is the canonical product description; this spec is the implementation map.

---

## 2. Status (at handoff)

- **Branch:** `feature/keystone` (cut from `main`), **pushed to `origin`**. NOT merged to main.
- **Build:** every phase verified with `npx tsc --noEmit`, `eslint`, and `npm run build`. The only eslint warnings are the standard "setState in useEffect to hydrate from localStorage" pattern (benign — localStorage is unavailable during SSR; lazy init would cause a hydration mismatch).
- **Auth:** `main` is on **next-auth v4**; this branch is off main so the Keystone API uses v4 `requireSession`. (A separate `authjs-v5-migration` branch exists; if main migrates to v5, re-test the keystone API — the imports stay the same.)
- **Commits (oldest → newest):**
  | hash | what |
  |------|------|
  | `ba55e17` | Phase 1 — Learning-Mode MVP (compiler + player) |
  | `8200426` | sample lesson loader |
  | `5fd3fd1` | Phase 2 — Revision + Doubt modes |
  | `cefbc93` | Phase 3 — the shelf (library + spaced-return) |
  | `6e47299` | Phase 4 — optional DB cross-device sync |
- **In flight:** an adversarial multi-agent **code review** of the whole feature was launched (4 dimensions: players / orchestrator+sync / contracts / API). Fold its **confirmed** findings in before merge. (If the run was lost, just re-run `/code-review high` on the branch diff.)
- **To activate DB sync:** run **`npm run db:push`** (adds the `KeystoneItem` table). Until then the feature **degrades gracefully** to on-device (localStorage) mode — the sync client treats any non-200 as "guest".

---

## 3. Architecture & file map

Split intentionally so a mode = a prompt + a schema + a validator + a player; the rest is shared.

```
lib/keystone/
  questionnaire.ts  Questionnaire definition (7 groups A–G) + KeystoneAnswers + missingRequired/showIf + str()/arr() helpers.
  prompt.ts         The compilers: buildLearningPrompt, buildRevisionPrompt, buildDoubtPrompt, buildDoubtFollowupPrompt (the iterative deeper re-prompt). THE PEDAGOGY IP. Must stay in sync with schema.ts field names.
  schema.ts         The contracts + LENIENT validators (never throw): KLesson/validateLesson, KRevisionBank/validateRevision, KDoubt/validateDoubt, parseLessonText (tolerant: strips ```json fences, grabs first balanced block). kindLabel().
  sample.ts         SAMPLE_LESSON_JSON / SAMPLE_REVISION_JSON / SAMPLE_DOUBT_JSON — valid fixtures + the "Try a sample" content.
  storage.ts        localStorage: answers, the SHELF (KLibraryItem[] + spaced schedule: markStudied/isDue, GAPS=1d/3d/1w/2w/1mo), revision mastery, newId(). All SSR-guarded.
  sync.ts           Fail-soft DB sync client: fetchRemoteItems/pushRemoteItem/deleteRemoteItem. Auth detected from the API (401 → guest). Never throws.

app/keystone/
  layout.tsx        Section root (renders <html>; mirrors app/my-banks/layout.tsx — the app has ~24 such segment roots, no single root layout).
  page.tsx          Server entry → KeystoneClient. NO auth gate (guests welcome).
  KeystoneClient.tsx  THE ORCHESTRATOR. State machine: intro(mode picker + shelf) → questionnaire | doubtinput → prompt → paste → play. Owns the shelf, the per-mode compiler/validator/player routing, sync wiring, resume.
  Questionnaire.tsx Tap-friendly form (chips) + required-field gating.
  LessonPlayer.tsx  Learning: advance-organizer map → prereqs → per-concept loop (anchor → hint ladder → worked example+self-explain → derivation → checks+calibration+self-score → teach-back) → interleaving → synthesis → spacing. Progress rail + calibration summary.
  RevisionPlayer.tsx Practice-test session: predict→produce→reveal→self-score; weak/overconfident-first queue (mastery-tiered, topic-interleaved); error re-study; mastery persisted; onMastered signal.
  DoubtPlayer.tsx   One angle at a time; "clicked"→retrieval check; "still stuck"→ iterative deeper-prompt loop (compiles buildDoubtFollowupPrompt, accepts a new paste, continues).
  primitives.tsx    Shared player UI: Md (MathRenderer wrapper), SectionHead, AttemptBox, HintLadder, Calibrate, SelfScore, ProduceReveal. (LessonPlayer has its OWN local copies — see Backlog: dedupe.)

app/api/keystone/
  route.ts          GET (list the caller's items) + POST (upsert one). requireSession + assertSameOrigin + rateLimit(120/60s) + Zod (400KB caps) + IDOR (never overwrite another user's id). Dates ↔ ms-epoch via toClient.
  [id]/route.ts     DELETE — userId-scoped deleteMany (IDOR-safe).

prisma/schema.prisma  model KeystoneItem (id, userId→User, mode, title, subject, data Json, progress Json?, reviewCount, lastStudiedAt, dueAt, timestamps) + back-relation on User.

components/layout/signed-in-navbar.tsx  "Keystone" nav link (desktop + mobile).
```

---

## 4. Data contracts (what the LLM returns)

`schema.ts` is authoritative. Shapes (the prompts ask for exactly these; the lenient validators normalize and fill defaults):

- **KLesson**: `title, subject, conceptMap{summary, concepts[{id,name,dependsOn[]}]}, prerequisites[{question,modelAnswer,ifShaky}], concepts[{id,name,anchorProblem{prompt,whatToNotice}, hintLadder[], workedExample[{text,selfExplain}], derivation[{prompt,answer}], checks[{kind:'retrieval'|'transfer',question,modelAnswer,rubric[]}], calibration{question,modelAnswer}, misconceptions[{misconception,correction}], teachBack{whatToExplain,checklist[]}}], interleaved[{prompt,whichConcept,modelAnswer}], synthesis[{question,modelAnswer}], spacing[{conceptId,returnAfter}]`
- **KRevisionBank**: `title, subject, questions[{id, kind:'retrieval'|'transfer', question, modelAnswer, rubric[], topic, difficulty:'easy'|'medium'|'hard'}]`
- **KDoubt**: `concept, methods[{kind:'analogy'|'first-principles'|'worked-example'|'edge-cases'|'visual'|'decomposition'|'socratic', title, content}], retrievalCheck{question,modelAnswer}`

Validator contract: `{ ok, lesson|bank|doubt, warnings[], missing[] }` — `ok=false` only when the core (concepts/questions/methods) is empty; `missing` drives the "ask your AI to continue" guidance on a truncated paste.

**IMPORTANT invariant:** when editing a prompt OR a schema, keep field names identical on both sides, or the player silently drops data. The validators are deliberately lenient (accept `selfExplanation` as an alias for `selfExplain`, `answer`/`prompt` aliases, etc.) — preserve that.

---

## 5. Persistence model

- **localStorage (storage.ts)** — guest + offline source of truth. Keys: `keystone.answers.v1`, `keystone.library.v1` (the shelf), `keystone.revision.v1` (mastery), plus legacy single-lesson keys.
- **Spaced return**: on completing a lesson (or mastering a revision set), `markStudied` advances `dueAt` along `GAPS = [1d,3d,1w,2w,1mo]` (indexed by `reviewCount`). The shelf shows `Not started` / `Due for review` / `Next review in Nd`.
- **DB sync (phase 4)** — when signed in, the shelf mirrors to `KeystoneItem`. On mount: pull cloud → device, push device-only → cloud (merge is **last-write-wins by item**, no per-field merge). Mutations push in the background (fire-and-forget). Doubt sessions are **ephemeral** (not shelved/synced).
- Client uses **ms-epoch numbers** for dates everywhere; the API converts to/from `DateTime`.

---

## 6. How to run / test

- Open **`/keystone`** (nav → Keystone). Works signed-out.
- Each **paste step has "Try a sample"** → loads a valid fixture so you can drive every player **without an LLM round-trip**. Fastest way to QA the players.
- Real loop: pick a mode → fill questionnaire (or doubt input) → **Copy prompt** → paste into any LLM with a chapter → copy its JSON → **Paste** → play.
- DB sync: `npm run db:push`, sign in, build a lesson on one browser, confirm it appears on another. Without the migration, everything still works on-device.
- Verify commands: `npx tsc --noEmit -p tsconfig.json` · `npx eslint app/keystone lib/keystone app/api/keystone` · `npm run build`.

---

## 7. Backlog / next phases

**Fold in first:** the in-flight review's confirmed findings (players empty-data edge cases, the sync merge race, contract field-name matches, API IDOR/Json-null). Re-run `/code-review high` on the branch if needed.

**Phase 5 candidates (ranked):**
1. **Revision bank persistence in the shelf** — currently the bank is shelved but RevisionPlayer keeps mastery in a single `keystone.revision.v1` keyed by bank *title*; unify so each shelf item carries its own mastery (and syncs).
2. **"Due today" aggregate view / nudge** — surface everything due across the shelf on entry (the spacing data already exists).
3. **Exam-date → concrete spacing dates** — the questionnaire captures `examWhen`; turn the `spacing` metadata into real calendar targets.
4. **Goal → auto-start mode** (currently only a "Suggested" badge).
5. **Teach-back LLM critique flow** — one-tap copy of the student's explanation + a critique prompt (Doubt already does the re-prompt loop; generalize it).
6. **Sync hardening** — debounce progress pushes; smarter merge than last-write-wins; an explicit "import device shelf to account" prompt on first sign-in.
7. **Dedupe primitives** — LessonPlayer still has local copies of Md/AttemptBox/etc.; move it onto `primitives.tsx` (reconcile the small prop diffs: LessonPlayer's AttemptBox had `minChars`, primitives' has `rows`).
8. Accessibility pass; progress metrics that measure understanding (teach-backs/transfer/calibration), never streaks.

**Known limitations (by design / deferred):** Doubt is ephemeral; an exhausted revision bank must be re-pasted (regenerate via the prompt); sync merge is last-write-wins; lesson quality is bottlenecked by the student's chosen model (stated honestly in the UI); the site can't fact-check the model's output.

---

## 8. Conventions (match these)

- **Design system (desk/paper theme):** classes `paper-sheet`, `type-display`, `type-data`; colors `ink`/`pencil`/`rule`/`ballpoint`/`paper`/`redpen`/`secondary`/`st-review`/`st-answered`. Buttons from `@/components/ui/button`. LaTeX/Markdown via `@/components/layout/MathRenderer` (`<MathRenderer text={...}/>`). The feature mirrors the **my-banks** "bring your own material" pattern.
- **Players are `"use client"`**; storage is SSR-safe (guards `typeof window`).
- **API security:** every mutating route uses `requireSession` (lib/auth) + `assertSameOrigin` + `rateLimit` (lib/rate-limit) + Zod validation + IDOR scoping by `session.user.id`. Match the existing keystone routes.
- No server AI anywhere; never add an API-key path.

---

## 9. Key decisions (so you don't relitigate)

- **No API key** — privacy (copyright never leaves the student's LLM), zero cost/liability, the student uses a model they trust. This is load-bearing; don't add server inference.
- **Front-loaded adaptivity** — the prompt anticipates (anchor problems, hint ladders, misconceptions); **Doubt's iterative re-prompt** + teach-back re-submission recover the live-tutor adaptivity a pre-generated lesson gives up.
- **Lenient validators + forgiving paste** — long chapters truncate; the flow accepts continuation pastes and reports what's `missing`.
- **localStorage-first, DB-optional** — the MVP needs no account; DB sync is an auth-detected, fail-soft layer.
- **Name:** "Keystone" (chosen over Crux / Lattice / The Click).
