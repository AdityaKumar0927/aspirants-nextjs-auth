import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const errorMessage = request.nextUrl.searchParams.get('error') || 'Unknown error';

  // You can customize the error handling logic here
  console.error(`Auth error: ${errorMessage}`);

  // Return a JSON response with the error details
  return NextResponse.json({ error: errorMessage }, { status: 400 });
}