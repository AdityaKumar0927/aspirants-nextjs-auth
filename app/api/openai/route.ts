import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// In-memory storage for chat history (use a database for persistence)
const chatHistory: { [sessionId: string]: { role: string; content: string }[] } = {};

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
      chatHistory[sessionId] = [{ role: 'system', content: 'You are a helpful assistant.' }];
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
        max_tokens: 150,
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
