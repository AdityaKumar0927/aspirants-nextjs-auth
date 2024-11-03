/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["lh3.googleusercontent.com", "vercel.com", "cdn.builder.io", "images.unsplash.com", "cdn.mathpix.com", "https://i.imghippo.com/files/Zm2044GO.png", "https://i.imghippo.com/files/QG3733OZk.png"],
  },
  async redirects() {
    return [
      {
        source: "/github",
        destination: "https://github.com/steven-tey/precedent",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
