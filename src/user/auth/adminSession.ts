/**
 * Interim admin session (M6).
 *
 * The PRD's real admin gate is "authenticated Google account + is_admin role"
 * (M7). Until then, /admin is protected by a signed session cookie issued after
 * a password check against ADMIN_PASSWORD. The middleware-based protection and
 * the cookie plumbing are the parts M7 keeps; only the credential check upgrades
 * to Google OAuth + an is_admin flag.
 *
 * The token is an HMAC-signed, expiring payload — no external dependency.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "tr_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function secret(): string {
  // AUTH_SECRET is the same secret M7's Auth.js uses; fall back to a loud dev
  // default so local dev works but production must set it.
  return (
    process.env.AUTH_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "dev-insecure-admin-secret-change-me"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Issue a token valid for MAX_AGE_SECONDS. `nowMs` is injectable for tests. */
export function createSessionToken(nowMs: number = Date.now()): string {
  const expires = Math.floor(nowMs / 1000) + MAX_AGE_SECONDS;
  const payload = `admin.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify signature and expiry. `nowMs` is injectable for tests. */
export function verifySessionToken(
  token: string | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresStr, sig] = parts;
  const payload = `${role}.${expiresStr}`;
  const expected = sign(payload);

  // Constant-time signature comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expires = Number.parseInt(expiresStr, 10);
  if (!Number.isFinite(expires)) return false;
  return expires * 1000 > nowMs;
}

/** Check a submitted password against ADMIN_PASSWORD (dev default in non-prod). */
export function checkAdminPassword(password: string): boolean {
  const expected =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV !== "production" ? "admin" : undefined);
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
