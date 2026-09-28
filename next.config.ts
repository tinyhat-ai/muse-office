import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // In-app navigation retains the policy of the first loaded Office page.
  // Exclude API responses, which have their own attachment security policy.
  async headers() {
    return [{ source: "/((?!api/).*)", headers: [{ key: "Content-Security-Policy", value: "frame-src 'none'" }] }];
  },
};

export default nextConfig;
