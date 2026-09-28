import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Keep an overview's frame on its srcdoc even if its content tries to navigate.
  async headers() {
    return [{ source: "/tasks/:id", headers: [{ key: "Content-Security-Policy", value: "frame-src 'none'" }] }];
  },
};

export default nextConfig;
