import { NextRequest, NextResponse } from 'next/server'
import { streamText, type ModelMessage } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { auth } from '@/auth'
import { resolveProvider } from '@/lib/ai'

export const runtime = 'edge'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
})

// Per-instance, best-effort conversation memory. Bounded in two ways so a
// long-lived edge instance can't grow it without limit (OOM): a hard key cap
// (FIFO-evict the oldest session) and a TTL dropped lazily on access.
const chatHistory: { [sessionId: string]: ModelMessage[] } = {}
const chatHistoryMeta = new Map<string, number>() // historyKey -> last-touched ms
const MAX_HISTORY_KEYS = 1000
const HISTORY_TTL_MS = 60 * 60 * 1000 // 1h

// Cap untrusted, LLM-bound free text so a caller can't blow the prompt /
// token budget (or the in-memory history) with a multi-megabyte field.
const MAX_FIELD_LEN = 8000

function touchHistory(key: string) {
  chatHistoryMeta.set(key, Date.now())
  // Evict the oldest session once over the cap (insertion order = LRU-ish here).
  while (chatHistoryMeta.size > MAX_HISTORY_KEYS) {
    const oldest = chatHistoryMeta.keys().next().value
    if (oldest === undefined) break
    chatHistoryMeta.delete(oldest)
    delete chatHistory[oldest]
  }
}

const systemPrompt: ModelMessage = {
  role: 'system',
  content: `
You are an expert in solving STEM (Science, Technology, Engineering, Mathematics) problems, trained to guide students towards finding accurate, formal, and detailed solutions. Your primary task is to receive STEM-related questions and respond with helpful hints and guidance, enabling students to work their way to the answers.

- Precision: Ensure that every hint you provide is precise and accurate. Pay attention to detail and verify the correctness of your guidance.
- Clarity: Explain each hint clearly and concisely. Avoid unnecessary jargon, but use formal and appropriate terminology.
- Detail: Provide comprehensive guidance for each part of the problem. If a concept or step is complex, break it down into simpler parts.
- Formality: Maintain a formal tone throughout your response. Use complete sentences and proper grammar.
- Examples: Where applicable, provide examples to illustrate your points. Ensure examples are relevant and enhance the understanding of the solution.
- Diagrams and Equations: Use LaTeX for typesetting mathematical equations and formulas. Include diagrams where necessary to aid in visual understanding.
- References: Cite any external references or standard formulas you use in your guidance.

When addressing a new question, follow these steps:

1. Understand the Problem: Carefully read the question to understand what is being asked.
2. Identify Relevant Concepts: Determine the key concepts and principles that apply to the problem.
3. Formulate the Guidance: Develop a structured approach to guide the student, breaking it down into manageable hints.
4. Provide Hints Step-by-Step: Offer a series of hints, ensuring each hint logically follows the previous one and leads the student closer to the solution.
5. Encourage Critical Thinking: Prompt the student to think critically and explore different approaches.
6. Review and Verify: Double-check your hints for accuracy and completeness. Correct any errors or omissions.

Remember: Your goal is to help students and professionals alike by providing high-quality, reliable, and educational guidance towards solving their STEM questions. The clearer and more detailed your hints, the more helpful they will be.

Examples of questions you might receive include but are not limited to:

- Solving complex mathematical equations.
- Explaining scientific principles and phenomena.
- Providing detailed guidance on engineering problems.
- Analyzing and interpreting data from experiments or studies.
- Offering step-by-step hints for coding and programming challenges.

By following these guidelines, you will ensure that your guidance is valuable, educational, and helps students to actively engage in problem-solving.

Please structure your responses with sections like "Example:", "Hint:", "Note:", and normal text. For instance:

Example:
Provide an example relevant to the problem.

Hint:
Give a hint that can help the student progress.

Note:
Include any additional important information.

For normal text, provide it directly without any specific heading.
`
}

export async function POST(req: NextRequest) {
  // Only signed-in users may consume the AI hint feature.
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate-limit per user (not per IP, which is shared behind NATs/proxies).
  const { success } = await ratelimit.limit(`openai:${userId}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const origin = req.headers.get('origin')
  if (origin !== process.env.ALLOWED_ORIGIN) {
    return NextResponse.json({ error: 'CORS error: Origin not allowed' }, { status: 403 })
  }

  try {
    const { question, context, sessionId } = await req.json()

    // Resolve the hint provider (Gemini free tier first by default, then Groq,
    // then OpenAI). All are reached over the OpenAI-compatible wire format, so
    // the same openai-edge client streams from whichever is configured.
    const provider = resolveProvider('hint')
    if (!provider) {
      return NextResponse.json(
        { error: 'No AI provider is configured on the server' },
        { status: 503 }
      )
    }
    // @ai-sdk/openai-compatible reaches Gemini/Groq/OpenAI over one wire format;
    // it has no built-in default base URL, so fall back to OpenAI's.
    const model = createOpenAICompatible({
      name: provider.provider,
      apiKey: provider.apiKey,
      baseURL: provider.baseURL ?? 'https://api.openai.com/v1',
    }).chatModel(provider.model)

    if (!question || !context || !sessionId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Question, context, and sessionId are required.' },
        { status: 400 }
      )
    }

    // Reject oversized untrusted input before it reaches the prompt or history.
    const contextStr = typeof context === 'string' ? context : JSON.stringify(context)
    if (
      String(question).length > MAX_FIELD_LEN ||
      contextStr.length > MAX_FIELD_LEN ||
      String(sessionId).length > MAX_FIELD_LEN
    ) {
      return NextResponse.json(
        { error: 'Bad Request', details: `Each field must be at most ${MAX_FIELD_LEN} characters.` },
        { status: 400 }
      )
    }

    // Scope history to the authenticated user so one user can never read
    // (or poison) another user's conversation by guessing a sessionId.
    const historyKey = `${userId}:${sessionId}`
    // Drop this session's history if it's gone stale, then mark it touched.
    const lastTouched = chatHistoryMeta.get(historyKey)
    if (lastTouched !== undefined && Date.now() - lastTouched > HISTORY_TTL_MS) {
      delete chatHistory[historyKey]
    }
    touchHistory(historyKey)
    if (!chatHistory[historyKey]) {
      chatHistory[historyKey] = [
        systemPrompt,
        { role: 'system', content: `Context: ${JSON.stringify(context)}` }
      ]
    }

    chatHistory[historyKey].push({ role: 'user', content: question })

    // Keep the 2 system messages + the 20 most recent turns (memory + token cap).
    if (chatHistory[historyKey].length > 22) {
      chatHistory[historyKey].splice(2, chatHistory[historyKey].length - 22)
    }

    // Reserve the assistant slot now, then fill it with the REAL reply once the
    // stream completes (was storing a "[Streaming Response]" placeholder, which
    // broke multi-turn context on the next request).
    const assistantMsg: ModelMessage = { role: 'assistant', content: '' }
    chatHistory[historyKey].push(assistantMsg)

    const result = streamText({
      model,
      messages: chatHistory[historyKey],
      temperature: 0.7,
      maxOutputTokens: provider.maxOutputTokens,
      onFinish: ({ text }) => {
        assistantMsg.content = text
      },
    })

    // Raw text token stream (not the AI-SDK data protocol) so the chat client's
    // TextDecoder reader renders it directly.
    return result.toTextStreamResponse()
  } catch (error) {
    const typedError = error as Error
    console.error('Server Error:', typedError)
    // Keep the detailed error server-side only; don't echo upstream provider
    // internals (quota/region/model errors) to the client.
    return NextResponse.json(
      { error: 'Internal Server Error', details: 'The AI service is temporarily unavailable.' },
      { status: 500 }
    )
  }
}