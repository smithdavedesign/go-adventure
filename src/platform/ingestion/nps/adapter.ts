/**
 * NPS Data API adapter.
 *
 * The NPS API is authoritative for park facts, official links, alerts, and fees
 * — NOT for trail geometry or editorial facets (difficulty, budget, trip
 * length). This adapter therefore normalizes only what NPS can confirm and
 * leaves editorial fields for a human reviewer. Permit type is `unknown` (never
 * inferred from fees) with the official URL for the editor to confirm.
 *
 * `fetchRaw` needs `NPS_API_KEY`. `normalize` is pure and fixture-testable.
 * See docs/adr/0006 (source licences) and the PRD Source Registry.
 */
import slugify from "@/shared/utils/slugify";
import {
  npsParkSchema,
  npsParksResponseSchema,
  type NpsPark,
} from "./schema";
import type {
  NormalizedDestinationDraft,
  RawRecord,
  SourceAdapter,
  SourceRegistry,
} from "@/platform/ingestion/types";
import type { Activity } from "@/shared/types/content";

const NPS_API_BASE = "https://developer.nps.gov/api/v1";

const REGISTRY: SourceRegistry = {
  name: "NPS Data API",
  baseUrl: NPS_API_BASE,
  licence: "US Government work / NPS terms — per-asset rights review required",
  attributionText: "Data courtesy of the National Park Service",
  termsUrl: "https://www.nps.gov/subjects/developer/terms-of-service.htm",
  commercialUse:
    "Facts/alerts/fees permitted with attribution; media and insignia are NOT assumed reusable",
  refreshPolicy: "daily",
  owner: "content",
};

/** Map NPS activity names to our Phase 1 launch taxonomy; drop the rest. */
function mapActivities(park: NpsPark): Activity[] {
  const out = new Set<Activity>();
  for (const a of park.activities) {
    const name = a.name.toLowerCase();
    if (name === "hiking") out.add("hiking");
    if (name === "backpacking") out.add("backpacking");
  }
  return [...out];
}

export class NpsAdapter implements SourceAdapter {
  readonly registry = REGISTRY;
  readonly normalizerVersion = "nps-v1";

  constructor(
    private readonly apiKey: string | undefined = process.env.NPS_API_KEY,
    /** Which parks to pull; keeps the curated Phase 1 corpus small. */
    private readonly parkCodes: string[] = [],
  ) {}

  async fetchRaw(): Promise<RawRecord[]> {
    if (!this.apiKey) {
      throw new Error(
        "NPS_API_KEY is not set — cannot fetch from the NPS API. " +
          "See docs/DEPENDENCIES.md (get a free key at nps.gov/subjects/developer).",
      );
    }
    const params = new URLSearchParams({ api_key: this.apiKey, limit: "50" });
    if (this.parkCodes.length) params.set("parkCode", this.parkCodes.join(","));

    const res = await fetch(`${NPS_API_BASE}/parks?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`NPS API responded ${res.status} ${res.statusText}`);
    }
    const json = npsParksResponseSchema.parse(await res.json());
    return json.data.map((payload) => {
      const parsed = npsParkSchema.safeParse(payload);
      const externalId = parsed.success
        ? parsed.data.parkCode
        : // Keep an id even for a record that will fail validation, so it can be
          // dead-lettered by id rather than dropped anonymously.
          String((payload as { parkCode?: unknown })?.parkCode ?? "unknown");
      return {
        externalId,
        canonicalUrl: parsed.success ? parsed.data.url : undefined,
        payload,
      };
    });
  }

  normalize(raw: RawRecord): NormalizedDestinationDraft {
    // Throws (ZodError) on invalid input — the pipeline dead-letters it.
    const park = npsParkSchema.parse(raw.payload);

    return {
      sourceExternalId: park.parkCode,
      name: park.fullName,
      slug: slugify(park.fullName),
      point: { lat: park.latitude, lng: park.longitude },
      summaryDraft: park.description || null,
      officialUrl: park.url,
      activities: mapActivities(park),
      bestMonths: [], // editorial — NPS does not provide a best-months judgement
      facts: [
        // Only source-confirmable facts. Editorial facets are intentionally absent.
        { field: "location", value: { lat: park.latitude, lng: park.longitude }, confidence: "confirmed" },
        { field: "officialUrl", value: park.url, confidence: "confirmed" },
        { field: "designation", value: park.designation, confidence: "confirmed" },
      ],
      permit: {
        // NEVER inferred. Editor confirms during review; official URL provided.
        requirementType: "unknown",
        scope: "Confirm current permit rules with the park before visiting",
        officialUrl: park.url,
      },
    };
  }
}
