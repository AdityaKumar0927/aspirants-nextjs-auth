import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import BankPracticeClient from "./BankPracticeClient";

export default async function BankPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const { id } = await params;
  const { mode } = await searchParams;
  const initialMode = mode === "exam" ? "EXAM" : mode === "bank" ? "BANK" : null;

  return <BankPracticeClient bankId={id} initialMode={initialMode} />;
}
