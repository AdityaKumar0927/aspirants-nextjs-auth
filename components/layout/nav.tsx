import SignedInNavbar from "./signed-in-navbar";
import SignedOutNavbar from "./signed-out-navbar";
import { auth } from "@/auth";

export default async function Nav() {
  const session = await auth();

  // Ensure that `session` is being correctly handled
  if (session) {
    return <SignedInNavbar session={session} />;
  } else {
    return <SignedOutNavbar />;
  }
}
