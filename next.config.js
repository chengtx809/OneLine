/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    API_MODEL: process.env.API_MODEL,
    API_KEY: process.env.API_KEY,
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_API_MODEL: process.env.NEXT_PUBLIC_API_MODEL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_ALLOW_USER_CONFIG: process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG,
    NEXT_PUBLIC_ACCESS_PASSWORD: process.env.NEXT_PUBLIC_ACCESS_PASSWORD,
    NEXT_PUBLIC_HAS_SERVER_CONFIG: !!process.env.API_ENDPOINT && !!process.env.API_KEY ? 'true' : 'false',
  },
};

module.exports = nextConfig;
