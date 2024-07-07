export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json();
    console.log('Received request:', { question, context });  // Log the received request

    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: `${context}\n\nQuestion: ${question}\nAnswer:`,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from OpenAI:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Error response from OpenAI', details: errorText }), { status: 500 });
    }

    const data = await response.json();
    console.log('Received response from OpenAI:', data);  // Log the response from OpenAI
    return new Response(JSON.stringify({ response: data.choices[0].text.trim() }), { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error('Error in OpenAI API route:', error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
  }
}
