import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import authConfig from "@/auth.config"
import { readEdgeFlags } from "@/lib/edge-flags"

/**
 * Edge middleware: admin protection + the DPDP onboarding gate (Auth.js v5).
 *
 * 1. /administrator/* stays admin-only.
 * 2. Suspended users are blocked from the whole app until restored.
 * 3. Any SIGNED-IN user who has not completed onboarding — captured DOB +
 *    accepted the consent notice, and (for minors) obtained VERIFIED parental
 *    consent — is redirected to /onboarding before they can use the app.
 *
 * It reads claims from the JWT-backed session ONLY (no Prisma) via the edge-safe
 * auth.config, so it stays edge-runtime-safe; those claims are kept fresh by the
 * jwt() re-sync in auth.ts. Signed-out visitors are untouched, so public pages
 * remain reachable. API routes are excluded from the matcher and keep their own
 * per-handler guards (defense in depth).
 */

// A NextAuth instance built from the EDGE-SAFE config only (no adapter/Prisma).
const { auth } = NextAuth(authConfig)

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
  "/maintenance", // the maintenance screen itself must always be reachable
]

function isExempt(pathname: string): boolean {
  return ONBOARDING_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

function isOnboarded(user: {
  onboardingComplete?: boolean
  parentalConsentOk?: boolean
}): boolean {
  // Minors stay gated until parental consent is VERIFIED (parentalConsentOk).
  return user.onboardingComplete === true && user.parentalConsentOk === true
}

export default auth(async (req) => {
  const user = req.auth?.user
  const { pathname } = req.nextUrl
  const isAdmin = user?.role === "administrator"

  // --- Edge abuse / maintenance fast-path -----------------------------------
  // Reads the Upstash-mirrored flags (lib/edge-flags). Best-effort: null when
  // Upstash isn't configured, in which case the authoritative Node-layer gate
  // (the maintenance gate in the public layout, the per-route guards) applies.
  const ip = (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    ""
  ).trim()
  const flags = await readEdgeFlags()

  if (flags?.ipBanList?.length && ip && !isAdmin && flags.ipBanList.some((b) => b.trim() === ip)) {
    return new NextResponse("Access denied.", { status: 403 })
  }

  if (
    flags?.maintenanceMode &&
    !isAdmin &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/administrator") &&
    !flags.maintenanceAllowIps.some((a) => a.trim() === ip)
  ) {
    return NextResponse.redirect(new URL("/maintenance", req.url))
  }
  // When the edge mirror EXPLICITLY says maintenance is off, don't strand anyone
  // on the maintenance screen. We require flags to be present (not null): if the
  // mirror is unavailable we must NOT bounce off /maintenance, or we'd ping-pong
  // with the Node-layer gate (which redirects TO /maintenance) into a loop.
  if (flags && !flags.maintenanceMode && pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // /administrator/* is admin-only. Non-admins (incl. signed-out) go home.
  if (pathname.startsWith("/administrator") && user?.role !== "administrator") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Suspended users (role set to "suspended" by an admin or the moderator abuse
  // breaker) are blocked. Handled before the onboarding gate so they aren't
  // bounced to /onboarding.
  if (user?.id && user.role === "suspended") {
    return pathname === "/suspended"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/suspended", req.url))
  }

  if (user?.id && !isOnboarded(user) && !isExempt(pathname)) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Match all app pages except API routes, Next internals, and static files
  // (any path containing a dot). The onboarding gate needs broad coverage
  // because there is no single root layout to host it.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)",
  ],
}
