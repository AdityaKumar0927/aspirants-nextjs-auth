"use client";

import { SessionProvider } from "next-auth/react";
import QuestionBankContent from "./QuestionBankContent";

export default function ClientQuestionBank() {
  return (
    <SessionProvider>
      <QuestionBankContent />
    </SessionProvider>
  );
}
