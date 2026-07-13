import type { NextConfig } from "next";

const r2PublicHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2PublicHostname
      ? [{ protocol: "https", hostname: r2PublicHostname }]
      : [],
  },
};

export default nextConfig;
