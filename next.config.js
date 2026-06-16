/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy. Scoped to the origins the app actually loads from:
//  - fonts: rsms.me (Inter), fonts.googleapis/gstatic (Dancing Script), cdnjs (FontAwesome)
//  - analytics: Vercel (same-origin /_vercel + vitals) and optional GA
//  - images: self + data/blob + any https host (avatars, question CDNs via next/image proxy)
// 'unsafe-inline' is required for scripts (next-themes' anti-FOUC inline script
// + Next's hydration bootstrap) and styles (Tailwind / next-font / inline
// style props). Nonce-based 'strict-dynamic' is the stronger next step but is
// impractical here — there is no single root layout to thread a nonce through.
// Enforced in production only so dev HMR/websockets/eval keep working.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://*.vercel-scripts.com https://www.googletagmanager.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://rsms.me https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' data: https://rsms.me https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://challenges.cloudflare.com",
  "frame-src 'self' https://accounts.google.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Baseline security headers applied to every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()",
  },
  // CSP enforced in production only (see note above).
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework/version (reduces fingerprinting).
  poweredByHeader: false,
  images: {
    // Self-hosted traced SVGs (public/q-img) are served via next/image; allow
    // SVG, sandboxed so the file can't execute scripts.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Hostnames only — full URLs here were invalid and silently ignored.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "vercel.com" },
      { protocol: "https", hostname: "cdn.builder.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.mathpix.com" },
      { protocol: "https", hostname: "i.imghippo.com" },
      { protocol: "https", hostname: "sjc.microlink.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // User/AI-generated uploads must never be sniffed into active content.
        source: "/uploads/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; sandbox; img-src 'self' data:",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/github",
        destination: "https://github.com/steven-tey/precedent",
        permanent: false,
      },
      // Preserve old PascalCase URLs after the kebab-case route rename.
      // NOTE: "/Contact" is intentionally NOT redirected — it case-folds to the
      // same string as "/contact", so Next's case-insensitive source matching
      // turns it into an infinite /contact → /contact redirect loop.
      { source: "/QuestionBank/:path*", destination: "/question-bank/:path*", permanent: true },
      { source: "/BrowseResources", destination: "/browse-resources", permanent: true },
      // Cookie policy consolidated onto /cookie-policy (the polished, DPDP-aware page).
      { source: "/cookies", destination: "/cookie-policy", permanent: true },
    ];
  },
};

module.exports = nextConfig;
