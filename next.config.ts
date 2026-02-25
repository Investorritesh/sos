import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Turbopack root config for workspace detection
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
