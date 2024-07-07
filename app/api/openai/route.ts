import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body of the request
    const body = await request.json();

    // Destructure question and context from the request body
    const { question, context } = body;

    // Check if the required environment variable is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Validate that question and context are provided
    if (!question || !context) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Question and context are required.' },
        { status: 400 }
      );
    }

    // Make the API call to OpenAI
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

    // Handle non-OK responses from the OpenAI API
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json(
        { error: 'OpenAI API Error', details: errorData },
        { status: response.status }
      );
    }

    // Parse the JSON response from the OpenAI API
    const data = await response.json();
    return NextResponse.json(
      { response: data.choices[0].message.content.trim() },
      { status: 200 }
    );
  } catch (error) {
    // Type-cast the error to `Error`
    const typedError = error as Error;
    console.error('Server Error:', typedError);
    return NextResponse.json(
      { error: 'Internal Server Error', details: typedError.message },
      { status: 500 }
    );
  }
}
