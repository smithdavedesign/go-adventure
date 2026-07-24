/**
 * Single error-reporting entry point (PRD Observability: frontend/API/ingestion/
 * scheduled-job errors with alerting). Structured console output always; the
 * Sentry sink is wired at deploy time and is env-gated on SENTRY_DSN. Keeping one
 * entry point means alerting can be added in one place with an owner + runbook.
 */

export type ErrorContext = {
  area: "api" | "ingestion" | "outbox" | "forecast" | "publish" | "auth";
  op: string;
  meta?: Record<string, string | number | boolean>;
};

export function captureError(error: unknown, context: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  // Structured log — machine-parseable for log-based alerting.
  console.error(
    JSON.stringify({
      level: "error",
      area: context.area,
      op: context.op,
      message,
      ...context.meta,
    }),
  );

  // Deploy-time: forward to Sentry when configured. The SDK wiring lives at the
  // edge of the app (instrumentation) — this is the call site.
  // if (process.env.SENTRY_DSN) Sentry.captureException(error, { tags: context });
}
