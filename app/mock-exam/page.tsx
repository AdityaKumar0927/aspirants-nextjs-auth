import { auth } from "@/auth"
import ClientMockExam from "./client-mock-exam"

export default async function MockExamPage() {
  const session = await auth()

  return <ClientMockExam session={session} />
}