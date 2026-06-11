import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Icons } from "@/components/landing/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Google } from "../shared/icons";
import { useToast } from "@/components/ui/use-toast";

export default function LoginForm() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn("google", { callbackUrl: "/", redirect: false });
      if (result?.error) {
        throw new Error(result.error);
      }
      // Handle successful sign-in
      window.location.href = result?.url || "/";
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({
        title: "Sign-in Error",
        description: "An error occurred during sign-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign-In</CardTitle>
        <CardDescription>
          Enter your details below to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Google className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Signing in..." : "Sign-In with Google"}
          </Button>
          {/* ... rest of the component remains the same ... */}
        </div>
      </CardContent>
    </Card>
  );
}