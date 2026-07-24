import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { securityHeaders } from "./src/shared/config/securityHeaders";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress source-map upload noise in dev; enable in CI with SENTRY_AUTH_TOKEN set.
  silent: !process.env.SENTRY_AUTH_TOKEN,
});
