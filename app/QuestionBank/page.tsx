import dynamic from 'next/dynamic';

// Import the client-side QuestionBank component
const ClientQuestionBank = dynamic(() => import('./ClientQuestionBank'), { ssr: false });

export default function QuestionBankPage() {
  return <ClientQuestionBank />;
}