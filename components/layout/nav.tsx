import SignedInNavbar from "./signed-in-navbar";
import SignedOutNavbar from "./signed-out-navbar";
import { auth } from "@/auth";
import { getSiteName } from "@/lib/site-config";

export default async function Nav() {
  const [session, siteName] = await Promise.all([auth(), getSiteName()]);

  // Site name is read server-side and prop-drilled into the (client) navbars so
  // the logo never flashes the default before hydration.
  if (session) {
    return <SignedInNavbar session={session} siteName={siteName} />;
  } else {
    return <SignedOutNavbar siteName={siteName} />;
  }
}
