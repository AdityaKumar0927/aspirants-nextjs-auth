import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Edge-safe auth configuration shared with the middleware. It MUST NOT import
 * Prisma or the adapter — the middleware runs on the Edge runtime. The full
 * configuration (auth.ts) extends this with the Prisma adapter, the DB-touching
 * jwt() role/onboarding re-sync, the dev-login provider, and the audit events.
 *
 * The session() callback lives HERE (not in auth.ts) because it only copies JWT
 * claims onto the session object — no DB — so the middleware's `req.auth`
 * carries role + DPDP onboarding flags for the gate logic.
 */
export default {
  // Vercel/serverless put the app behind a proxy; trust the forwarded host.
  trustHost: true,
  // v5 reads AUTH_SECRET by default; accept the legacy NEXTAUTH_SECRET too so the
  // existing env var keeps working (no forced rotation on migration).
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Shorter than the 30-day default so stale roles / revoked sessions expire.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google verifies email ownership and our signIn() callback owns user
      // creation, so linking a Google account to the existing email row is safe
      // and required by the flow. (See auth.ts signIn().)
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Copy JWT claims onto the session. Edge-safe (no DB): runs at the edge so
    // the middleware can read role + onboarding flags from req.auth.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false
        session.user.isMinor = (token.isMinor as boolean) ?? false
        session.user.parentalConsentOk = (token.parentalConsentOk as boolean) ?? false
      }
      return session
    },
  },
} satisfies NextAuthConfig
