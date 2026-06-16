import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import MyBanksClient from "./MyBanksClient";

export default async function MyBanksPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/api/auth/signin");
  return <MyBanksClient />;
}
