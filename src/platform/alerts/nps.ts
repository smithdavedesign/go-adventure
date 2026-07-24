/**
 * NPS alerts client + normalizer.
 *
 * Official park alerts/closures are dynamic, safety-relevant data: they are
 * expiring, attributable snapshots with official links — never permanent fields,
 * never presented as anything but the park's own current notices (PRD Safety /
 * Dynamic Information). `normalizeAlerts` is pure and fixture-testable;
 * `fetchAlerts` hits the NPS API and needs NPS_API_KEY.
 */
import { z } from "zod";

const NPS_API_BASE = "https://developer.nps.gov/api/v1";

export const PROVIDER = "nps" as const;

export type NormalizedAlert = {
  title: string;
  /** NPS category: Information | Caution | Danger | Park Closure. */
  category: string;
  url: string | null;
  description: string;
};

export type NormalizedAlerts = {
  provider: typeof PROVIDER;
  parkCode: string;
  observedAt: string;
  alerts: NormalizedAlert[];
};

const alertSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional().default("Information"),
  url: z.string().optional().default(""),
  description: z.string().optional().default(""),
  parkCode: z.string(),
});

const alertsResponseSchema = z.object({ data: z.array(z.unknown()) });

/** Pure: group a raw NPS `/alerts` response by parkCode into per-park snapshots. */
export function normalizeAlerts(
  raw: unknown,
  observedAtIso: string,
): NormalizedAlerts[] {
  const parsed = alertsResponseSchema.parse(raw);
  const byPark = new Map<string, NormalizedAlert[]>();

  for (const item of parsed.data) {
    const a = alertSchema.safeParse(item);
    if (!a.success) continue; // skip malformed alerts, don't fail the batch
    const list = byPark.get(a.data.parkCode) ?? [];
    list.push({
      title: a.data.title,
      category: a.data.category,
      url: a.data.url || null,
      description: a.data.description,
    });
    byPark.set(a.data.parkCode, list);
  }

  return [...byPark.entries()].map(([parkCode, alerts]) => ({
    provider: PROVIDER,
    parkCode,
    observedAt: observedAtIso,
    alerts,
  }));
}

export async function fetchAlerts(
  parkCodes: string[],
  observedAtIso: string,
  apiKey: string | undefined = process.env.NPS_API_KEY,
): Promise<NormalizedAlerts[]> {
  if (!apiKey) {
    throw new Error("NPS_API_KEY is not set — cannot fetch NPS alerts.");
  }
  // Raw commas in parkCode (URLSearchParams would %2C-encode them — see the NPS
  // adapter for the same gotcha).
  const params = new URLSearchParams({ api_key: apiKey, limit: "200" });
  const codeParam = parkCodes.length
    ? `&parkCode=${parkCodes.map(encodeURIComponent).join(",")}`
    : "";
  const res = await fetch(`${NPS_API_BASE}/alerts?${params.toString()}${codeParam}`);
  if (!res.ok) throw new Error(`NPS alerts responded ${res.status}`);
  return normalizeAlerts(await res.json(), observedAtIso);
}
