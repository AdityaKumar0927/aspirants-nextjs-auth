import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";

/**
 * Edge middleware: admin protection + the DPDP onboarding gate.
 *
 * 1. /administrator/* stays admin-only (authorized callback).
 * 2. Any SIGNED-IN user who has not completed onboarding — captured DOB +
 *    accepted the consent notice, and (for minors) obtained VERIFIED parental
 *    consent — is redirected to /onboarding before they can use the app.
 *
 * The gate reads flags from the JWT ONLY (no Prisma), so it stays edge-safe;
 * those flags are kept fresh by the jwt() re-sync in
 * app/api/auth/[...nextauth]/options.ts. Signed-out visitors are untouched, so
 * public pages remain reachable. API routes are excluded from the matcher and
 * keep their own per-handler guards (defense in depth).
 */

// Paths a signed-in but un-onboarded user may still reach (legal notices, the
// onboarding flow itself, and the parental-consent verification landing page).
const ONBOARDING_EXEMPT = [
  "/onboarding",
  "/parental-consent",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/cookies",
  "/consent-notice",
  "/grievance",
  "/blueprint", // public, SEO-facing — reachable without onboarding
];

function isExempt(pathname: string): boolean {
  return ONBOARDING_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isOnboarded(token: JWT): boolean {
  // Minors stay gated until parental consent is VERIFIED (parentalConsentOk).
  return token.onboardingComplete === true && token.parentalConsentOk === true;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Suspended users (role set to "suspended" by an admin or the moderator
    // abuse breaker) are blocked from the whole app until restored. Handled
    // before the onboarding gate so they aren't bounced to /onboarding.
    if (token?.id && token.role === "suspended") {
      return pathname === "/suspended"
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/suspended", req.url));
    }

    if (token?.id && !isOnboarded(token) && !isExempt(pathname)) {
      const url = new URL("/onboarding", req.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Gate /administrator on the admin role (redirects to sign-in otherwise).
      // Everything else stays public for signed-out users; the onboarding
      // redirect above only fires when a token is present.
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/administrator")) {
          return token?.role === "administrator";
        }
        return true;
      },
    },
  }
);

export const config = {
  // Match all app pages except API routes, Next internals, and static files
  // (any path containing a dot). The onboarding gate needs broad coverage
  // because there is no single root layout to host it.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)",
  ],
};
