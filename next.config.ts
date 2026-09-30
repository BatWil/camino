import type { NextConfig } from "next";

/**
 * One frontend for web, PWA, Android and iOS: the app is exported as static
 * files (out/) that are served by any static host and bundled by Capacitor.
 * Data comes from Supabase at runtime (client-side, protected by RLS).
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
