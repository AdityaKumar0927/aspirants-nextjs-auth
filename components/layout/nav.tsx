import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import SignedInNavbar from "./signed-in-navbar";
import SignedOutNavbar from "./signed-out-navbar";
import { getServerSession } from "next-auth/next";

export default async function Nav() {
  const session = await getServerSession(authOptions);

  // Ensure that `session` is being correctly handled
  if (session) {
    return <SignedInNavbar session={session} />;
  } else {
    return <SignedOutNavbar />;
  }
}
