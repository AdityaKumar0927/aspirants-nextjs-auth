import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: question }
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json({ error: 'OpenAI API Error', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ response: data.choices[0].message.content.trim() }, { status: 200 });
  } catch (error) {
    // Assert the error type to `Error`
    const typedError = error as Error;
    console.error('Server Error:', typedError);
    return NextResponse.json({ error: 'Internal Server Error', details: typedError.message }, { status: 500 });
  }
}
