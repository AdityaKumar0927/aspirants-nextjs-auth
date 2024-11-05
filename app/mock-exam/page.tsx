import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/options"
import ClientMockExam from "./client-mock-exam"

export default async function MockExamPage() {
  const session = await getServerSession(authOptions)

  return <ClientMockExam session={session} />
}