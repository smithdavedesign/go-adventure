/**
 * Security response headers (PRD Security: CSP, secure headers). Applied to all
 * routes via next.config.ts. Kept in one place so the policy is reviewable.
 *
 * CSP notes:
 *  - `connect-src`/`img-src` allow the specific external hosts the app uses:
 *    MapLibre demo tiles (dev), Open-Meteo, Google OAuth. Tighten to the
 *    production tile provider when ADR-0005 is decided.
 *  - `'unsafe-inline'` for styles is required by Tailwind's injected styles; a
 *    nonce-based strict CSP is a hardening follow-up (needs middleware nonces).
 */

// React's dev build uses eval() for debugging (never in production — React says
// so explicitly). Allow it in development only so prod stays strict.
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  // Next.js injects some inline scripts; 'unsafe-inline' kept for now. Replace
  // with per-request nonces during CSP hardening.
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://demotiles.maplibre.org https://*.basemaps.cartocdn.com",
  "connect-src 'self' https://demotiles.maplibre.org https://api.open-meteo.com https://accounts.google.com",
  "font-src 'self' data:",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    // HSTS — only meaningful over HTTPS; harmless on localhost.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];
