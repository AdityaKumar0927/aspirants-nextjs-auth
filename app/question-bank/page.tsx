import dynamic from 'next/dynamic';

const ClientQuestionBank = dynamic(() => import('./ClientQuestionBank'), { ssr: false });

export default function QuestionBankPage() {
  return <ClientQuestionBank />;
}