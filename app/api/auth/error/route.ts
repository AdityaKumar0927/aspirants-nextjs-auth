import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KNOWN_ERROR_CODES = new Set([
  'Configuration',
  'AccessDenied',
  'Verification',
  'CredentialsSignin',
  'OAuthAccountNotLinked',
  'Default',
]);

export async function GET(request: NextRequest) {
  const rawError = request.nextUrl.searchParams.get('error') || 'Default';

  // Strip CR/LF and other control chars to prevent log injection.
  const safeError = rawError.replace(/[\x00-\x1f\x7f]/g, '');

  // You can customize the error handling logic here
  console.error(`Auth error: ${safeError}`);

  // Only reflect an allowlisted NextAuth error code; otherwise return a generic code.
  const errorCode = KNOWN_ERROR_CODES.has(safeError) ? safeError : 'Default';

  // Return a JSON response with the error details
  return NextResponse.json({ error: errorCode }, { status: 400 });
}
