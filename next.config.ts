import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Old admin URLs, kept so bookmarks still land (query strings carry over)
  async redirects() {
    return [
      { source: "/admin/achievement-sets", destination: "/admin/trophy-lists", permanent: true },
      { source: "/admin/achievements", destination: "/admin/trophies", permanent: true },
    ];
  },
};

export default nextConfig;
