"use client";

import dynamic from 'next/dynamic';

// Client Component: Next 16 only allows `ssr: false` in next/dynamic here.
const ClientQuestionBank = dynamic(() => import('./ClientQuestionBank'), { ssr: false });

export default function QuestionBankPage() {
  return <ClientQuestionBank />;
}