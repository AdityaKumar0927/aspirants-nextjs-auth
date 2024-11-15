import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthError() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>There was a problem signing you in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We encountered an error while trying to authenticate you. This could be due to various reasons such as:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Invalid credentials</li>
            <li>Account not found</li>
            <li>Server-side issues</li>
            <li>Temporary network problems</li>
          </ul>
          <p>Please try again or contact support if the problem persists.</p>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Return to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}