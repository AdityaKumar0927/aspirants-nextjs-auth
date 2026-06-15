"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "submitting" | "done" | "error";

export default function VerifyConfirm({ token }: { token: string | null }) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="mt-6 text-sm text-redpen">
        This approval link is missing its token. Please use the link from the
        email exactly as sent.
      </p>
    );
  }

  if (state === "done") {
    return (
      <div role="status" className="mt-6 border-l-2 border-st-answered py-1 pl-3">
        <p className="text-sm font-medium text-st-answered">
          Thank you — your child&rsquo;s account is now approved. They can
          continue on their device.
        </p>
      </div>
    );
  }

  async function confirm() {
    setState("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/parental-consent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Could not approve. The link may have expired.");
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="mt-6">
      <Button
        onClick={confirm}
        disabled={state === "submitting"}
        className="min-h-11 w-full"
      >
        {state === "submitting" ? "Approving" : "I approve this account"}
      </Button>
      {message && <p className="mt-3 text-sm text-redpen">{message}</p>}
    </div>
  );
}
