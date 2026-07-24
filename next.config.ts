import type { NextConfig } from "next";
import { securityHeaders } from "./src/shared/config/securityHeaders";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
