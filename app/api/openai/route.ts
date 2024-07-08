import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// In-memory storage for chat history (use a database for persistence)
const chatHistory: { [sessionId: string]: { role: string; content: string }[] } = {};

// Define the system prompt
const systemPrompt = `
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
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context, sessionId } = body;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    if (!question || !context || !sessionId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Question, context, and sessionId are required.' },
        { status: 400 }
      );
    }

    // Initialize chat history if not present
    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [{ role: 'system', content: systemPrompt }];
    }

    // Add user question to chat history
    chatHistory[sessionId].push({ role: 'user', content: question });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: chatHistory[sessionId],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json(
        { error: 'OpenAI API Error', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content.trim();

    // Add assistant response to chat history
    chatHistory[sessionId].push({ role: 'assistant', content: assistantResponse });

    return NextResponse.json(
      { response: assistantResponse },
      { status: 200 }
    );
  } catch (error) {
    const typedError = error as Error;
    console.error('Server Error:', typedError);
    return NextResponse.json(
      { error: 'Internal Server Error', details: typedError.message },
      { status: 500 }
    );
  }
}
