/**
 * Non-production test login. Creates (or reuses) a test user + a real Auth.js
 * database session and sets the session cookie, so E2E and local dev can sign in
 * without live Google OAuth. HARD-DISABLED in production.
 *
 * This exists because our session strategy is database (ADR-0002) and we
 * deliberately did NOT add a Credentials provider (which would force JWT and
 * violate "one explicit strategy"). Instead we mint a DB session directly here.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/shared/config/db";
import { clientKey, rateLimit } from "@/platform/security/rateLimit";

// Auth.js v5 database-session cookie name on http (dev). In production it's
// `__Secure-authjs.session-token`, but this route never runs in production.
const SESSION_COOKIE = "authjs.session-token";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Rate-limit even the dev endpoint — demonstrates the abuse-control pattern
  // that production auth mutations use.
  if (!rateLimit(clientKey(request, "dev-login"), 20, 60_000).allowed) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "tester@example.com";
  const admin = url.searchParams.get("admin") === "1";

  const user = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: admin },
    create: { email, name: "Test User", isAdmin: admin },
  });

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const res = NextResponse.redirect(new URL(url.searchParams.get("next") ?? "/", request.url));
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return res;
}
