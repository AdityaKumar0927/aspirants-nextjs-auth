import dynamic from 'next/dynamic'

const ClientMockExam = dynamic(() => import('./ClientMockExam'), { ssr: false })

export default function MockExamPage() {
  return <ClientMockExam />
}