import { NextRequest, NextResponse } from 'next/server'
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

export const runtime = 'edge'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
})

const chatHistory: { [sessionId: string]: ChatCompletionRequestMessage[] } = {}

const systemPrompt: ChatCompletionRequestMessage = {
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
  const ip = headers().get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const origin = req.headers.get('origin')
  if (origin !== process.env.ALLOWED_ORIGIN) {
    return NextResponse.json({ error: 'CORS error: Origin not allowed' }, { status: 403 })
  }

  try {
    const { question, context, sessionId } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    if (!question || !context || !sessionId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Question, context, and sessionId are required.' },
        { status: 400 }
      )
    }

    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [
        systemPrompt,
        { role: 'system', content: `Context: ${JSON.stringify(context)}` } as ChatCompletionRequestMessage
      ]
    }

    chatHistory[sessionId].push({ role: 'user', content: question } as ChatCompletionRequestMessage)

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: chatHistory[sessionId],
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
    })

    const stream = OpenAIStream(response)

    chatHistory[sessionId].push({ role: 'assistant', content: '[Streaming Response]' } as ChatCompletionRequestMessage)

    return new StreamingTextResponse(stream)
  } catch (error) {
    const typedError = error as Error
    console.error('Server Error:', typedError)
    return NextResponse.json(
      { error: 'Internal Server Error', details: typedError.message },
      { status: 500 }
    )
  }
}