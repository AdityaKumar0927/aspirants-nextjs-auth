import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import BankEditor from "./BankEditor";

export default async function EditBankPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/api/auth/signin");
  const { id } = await params;
  return <BankEditor bankId={id} />;
}
