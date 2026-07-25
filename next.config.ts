import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { securityHeaders } from "./src/shared/config/securityHeaders";

const nextConfig: NextConfig = {
  env: {
    // Client-side maps require a NEXT_PUBLIC key. Mirror MAP_TILES_API_KEY so
    // local/dev setups that only set the server-style name still render maps.
    NEXT_PUBLIC_MAPTILER_KEY:
      process.env.NEXT_PUBLIC_MAPTILER_KEY ?? process.env.MAP_TILES_API_KEY ?? "",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source-map upload noise in dev; enable in CI with SENTRY_AUTH_TOKEN set.
  silent: !process.env.SENTRY_AUTH_TOKEN,
});
