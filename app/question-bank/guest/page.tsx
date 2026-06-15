"use client";

import dynamic from "next/dynamic";

// The /guest route now reuses the main question bank — it already renders for
// unsigned users (public read APIs, session-null-safe rendering, no auth gate).
// Keeps the /question-bank/guest URL (5 inbound links, incl. the landing page)
// working off a single implementation instead of a divergent duplicate.
const ClientQuestionBank = dynamic(() => import("../ClientQuestionBank"), { ssr: false });

export default function GuestQuestionBankPage() {
  return <ClientQuestionBank />;
}
