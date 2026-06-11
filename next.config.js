/** @type {import('next').NextConfig} */

// Baseline security headers applied to every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Hostnames only — full URLs here were invalid and silently ignored.
    remotePatterns: [
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
      { source: "/QuestionBank/:path*", destination: "/question-bank/:path*", permanent: true },
      { source: "/Contact", destination: "/contact", permanent: true },
      { source: "/BrowseResources", destination: "/browse-resources", permanent: true },
      { source: "/NotesPage", destination: "/notes-page", permanent: true },
    ];
  },
};

module.exports = nextConfig;
