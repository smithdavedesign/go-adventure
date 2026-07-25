/**
 * Search autocomplete endpoint (PRD binding slice: "keyword search, autocomplete").
 * Returns up to 6 published destinations whose name matches the query, for the
 * Explore search box. Read-only, published content only; rate-limited per client.
 */
import { NextResponse } from "next/server";
import { suggestDestinations } from "@/content/destinations/queries";
import { clientKey, rateLimit } from "@/platform/security/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit(clientKey(request, "suggest"), 120, 60_000).allowed) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await suggestDestinations(q, 6);
  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
