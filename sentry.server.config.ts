import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Traces 10% of requests in production; full tracing in dev.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Do not initialise if DSN is missing (local dev without a key).
  enabled: !!process.env.SENTRY_DSN,
});
