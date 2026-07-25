/**
 * Security response headers (PRD Security: CSP, secure headers). Applied to all
 * routes via next.config.ts. Kept in one place so the policy is reviewable.
 *
 * CSP notes:
 *  - `connect-src`/`img-src` allow the specific external hosts the app uses:
 *    MapTiler (production tiles, ADR-0005), the MapLibre demo style (local dev),
 *    Open-Meteo, `upload.wikimedia.org` (hero photos), and Google OAuth.
 *  - `worker-src 'self' blob:` is REQUIRED by MapLibre GL: it renders tiles in a
 *    Web Worker created from a `blob:` URL. Without it the worker falls back to
 *    `default-src 'self'`, is blocked, and every map renders blank.
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
  "img-src 'self' data: blob: https://demotiles.maplibre.org https://*.basemaps.cartocdn.com https://api.maptiler.com https://*.maptiler.com https://upload.wikimedia.org",
  "connect-src 'self' https://demotiles.maplibre.org https://api.maptiler.com https://*.maptiler.com https://api.open-meteo.com https://accounts.google.com",
  // MapLibre GL runs its tile worker from a blob: URL — without this the map is blank.
  "worker-src 'self' blob:",
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
