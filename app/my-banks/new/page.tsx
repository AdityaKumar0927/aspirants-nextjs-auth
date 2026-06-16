import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import CreateBankClient from "./CreateBankClient";

export default async function NewBankPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/api/auth/signin");
  return <CreateBankClient />;
}
