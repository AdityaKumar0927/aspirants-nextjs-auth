export const config = { runtime: 'edge' }; // Ensure Edge Runtime

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json();
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

    const data = await response.json();
    return new Response(JSON.stringify({ response: data.choices[0].text.trim() }), { status: 200 });
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
