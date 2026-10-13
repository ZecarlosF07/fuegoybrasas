import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.APP_BUILD_PROFILE === "manual-h6" ? ".test-fixtures/h6-manual-next" : ".next",
  cacheComponents: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
  allowedDevOrigins: ["127.0.0.1"],
  // Limita procesos de build: la detección de CPU agotó memoria con Docker en Windows.
  experimental: { cpus: 2 },
  logging: { incomingRequests: false, serverFunctions: false, browserToTerminal: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "geazxsvjkqpzbghlywbw.supabase.co", port: "", pathname: "/storage/v1/object/public/catalog-media/items/**", search: "" },
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL === "http://127.0.0.1:54321" ? [new URL("http://127.0.0.1:54321/storage/v1/object/public/catalog-media/items/**")] : []),
    ],
    dangerouslyAllowLocalIP: process.env.NEXT_PUBLIC_SUPABASE_URL === "http://127.0.0.1:54321",
  },
};

export default nextConfig;
