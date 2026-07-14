import type { NextConfig } from "next";

const r2PublicHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2PublicHostname
      ? [{ protocol: "https", hostname: r2PublicHostname }]
      : [],
  },
  async headers() {
    return [
      {
        // Blocks third-party iframe embedding site-wide (clickjacking/UI-redressing defense,
        // flagged by the M3 tenant-security review re: /studio and /r/[slug]?mode=preview).
        // 'self' still allows Studio's own preview iframe (same-origin embedding /r/[slug]).
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
      },
    ];
  },
};

export default nextConfig;
