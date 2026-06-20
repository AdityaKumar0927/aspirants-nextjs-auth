/**
 * Central AI provider resolution.
 *
 * The app has two AI features: PDF question extraction (vision + structured
 * JSON, in `/api/import/extract`) and streaming STEM hints (`/api/openai`).
 * Both were OpenAI-only. This module lets them run on Google Gemini's free
 * tier by default — falling back to Groq (hints only) and then OpenAI —
 * WITHOUT touching the SDK call sites: every provider here speaks the OpenAI
 * Chat Completions wire format (Gemini and Groq via their documented
 * OpenAI-compatibility endpoints), so the existing `openai` / `openai-edge`
 * clients work unchanged. Only the base URL, API key and model name differ.
 *
 * This file imports no SDK and touches no Node/Edge-only API, so it is safe to
 * import from both the Node route and the Edge route.
 *
 * Configuration (all optional; resolution degrades to whatever keys exist):
 *   AI_PROVIDER             auto | gemini | groq | openai   (default: auto)
 *   GEMINI_API_KEY          (or GOOGLE_GENERATIVE_AI_API_KEY)
 *   GROQ_API_KEY
 *   OPENAI_API_KEY
 *   GEMINI_EXTRACTION_MODEL (default: gemini-2.5-flash)
 *   GEMINI_HINT_MODEL       (default: gemini-2.5-flash)
 *   GROQ_HINT_MODEL         (default: llama-3.3-70b-versatile)
 *   OPENAI_EXTRACTION_MODEL (default: gpt-4o)
 *   OPENAI_HINT_MODEL       (default: gpt-4o-mini)
 *
 * "auto" preserves the previous behavior when only OPENAI_API_KEY is set, and
 * automatically prefers the free Gemini tier the moment GEMINI_API_KEY exists.
 */

export type AiProviderName = "gemini" | "groq" | "openai";
export type AiTask = "hint" | "extraction";

export interface ResolvedProvider {
  provider: AiProviderName;
  apiKey: string;
  /** undefined for native OpenAI; set for OpenAI-compatible providers. */
  baseURL?: string;
  model: string;
  /** Vision (image input) support — gates which providers can do extraction. */
  vision: boolean;
  /**
   * response_format mode for structured-output (extraction) calls. Gemini's
   * OpenAI-compat layer rejects OpenAI's strict json_schema — it can't model
   * nullability via JSON-Schema type-arrays (`["string","null"]`) or the
   * `additionalProperties`/`strict` keywords, and 400s the whole request. So
   * Gemini uses plain `json_object` (the schema is embedded in the prompt and
   * the output is Zod-validated downstream); native OpenAI keeps strict
   * `json_schema`.
   */
  jsonMode: "json_schema" | "json_object";
  /**
   * Output-token ceiling for the call. Gemini 2.5 "thinking" tokens count
   * against this budget, so Gemini gets generous headroom to avoid truncated
   * JSON; OpenAI stays under gpt-4o's 16384 hard ceiling.
   */
  maxOutputTokens: number;
}

// OpenAI-compatibility endpoints (no trailing slash — both `openai` and
// `openai-edge` append "/chat/completions").
const GEMINI_OPENAI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai";
const GROQ_OPENAI_BASE_URL = "https://api.groq.com/openai/v1";

function geminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

function buildGemini(task: AiTask): ResolvedProvider | null {
  const apiKey = geminiKey();
  if (!apiKey) return null;
  const model =
    task === "extraction"
      ? process.env.GEMINI_EXTRACTION_MODEL || "gemini-2.5-flash"
      : process.env.GEMINI_HINT_MODEL || "gemini-2.5-flash";
  return {
    provider: "gemini",
    apiKey,
    baseURL: GEMINI_OPENAI_BASE_URL,
    model,
    vision: true,
    jsonMode: "json_object",
    // gemini-2.5-flash supports up to 65536 output tokens; give thinking +
    // dense multi-page JSON plenty of room (extraction) or a comfortable hint
    // budget that thinking tokens won't starve.
    maxOutputTokens: task === "extraction" ? 32_000 : 4_000,
  };
}

function buildGroq(task: AiTask): ResolvedProvider | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  // No production vision model is wired for Groq here, so it can only serve
  // the text-only hint endpoint, never extraction.
  if (task === "extraction") return null;
  const model = process.env.GROQ_HINT_MODEL || "llama-3.3-70b-versatile";
  return {
    provider: "groq",
    apiKey,
    baseURL: GROQ_OPENAI_BASE_URL,
    model,
    vision: false,
    jsonMode: "json_object",
    maxOutputTokens: 4_000,
  };
}

function buildOpenAI(task: AiTask): ResolvedProvider | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model =
    task === "extraction"
      ? process.env.OPENAI_EXTRACTION_MODEL || "gpt-4o"
      : process.env.OPENAI_HINT_MODEL || "gpt-4o-mini";
  // baseURL left undefined → SDK defaults to api.openai.com.
  return {
    provider: "openai",
    apiKey,
    model,
    vision: true,
    jsonMode: "json_schema",
    // Stay under gpt-4o's 16384 output-token hard ceiling.
    maxOutputTokens: task === "extraction" ? 12_000 : 1_500,
  };
}

const BUILDERS: Record<AiProviderName, (t: AiTask) => ResolvedProvider | null> = {
  gemini: buildGemini,
  groq: buildGroq,
  openai: buildOpenAI,
};

/**
 * Order to try providers. AI_PROVIDER pins a single provider; "auto" (default)
 * prefers the free tiers first and falls back to paid OpenAI.
 */
function priorityOrder(): AiProviderName[] {
  // .trim() so a stray space/newline in the .env value (e.g. "openai ") doesn't
  // silently miss the pin and fall through to the full auto chain.
  const pin = (process.env.AI_PROVIDER || "auto").trim().toLowerCase();
  if (pin === "gemini") return ["gemini"];
  if (pin === "groq") return ["groq"];
  if (pin === "openai") return ["openai"];
  if (pin !== "auto" && pin !== "") {
    console.warn(
      `[ai] Unknown AI_PROVIDER "${pin}"; falling back to auto (gemini > groq > openai).`
    );
  }
  return ["gemini", "groq", "openai"];
}

/**
 * Ordered list of usable providers for a task (best first). Providers without a
 * configured key — or that can't satisfy the task, e.g. Groq for vision — are
 * omitted. Empty array means no provider is configured.
 */
export function resolveProviders(
  task: AiTask,
  opts?: { forceFallback?: boolean }
): ResolvedProvider[] {
  const out: ResolvedProvider[] = [];
  for (const name of priorityOrder()) {
    const p = BUILDERS[name](task);
    if (p) out.push(p);
  }
  // Admin "force AI fallback" kill switch: skip the PRIMARY provider (e.g. during
  // a Gemini outage) without a redeploy — but only if a fallback actually exists,
  // so forcing it can never leave the task with no provider.
  if (opts?.forceFallback && out.length > 1) out.shift();
  return out;
}

/** Best provider for a task, or null if no API key is configured. */
export function resolveProvider(
  task: AiTask,
  opts?: { forceFallback?: boolean }
): ResolvedProvider | null {
  return resolveProviders(task, opts)[0] ?? null;
}
