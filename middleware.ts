import { withAuth } from "next-auth/middleware";

/**
 * Protects the entire /administrator section at the edge.
 * Unauthenticated users are redirected to the sign-in page;
 * authenticated non-admins get a 403 via the authorized callback.
 *
 * API routes keep their own per-handler guards (see lib/auth.ts) —
 * defense in depth rather than middleware-only protection.
 */
export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === "administrator",
  },
});

export const config = {
  matcher: ["/administrator/:path*"],
};
