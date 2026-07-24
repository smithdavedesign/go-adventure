/**
 * Recreation.gov (RIDB) adapter. Recreation-area, facility, campground, and
 * permit metadata. Like NPS, it is authoritative for official facts and links —
 * NOT for editorial facets or trail geometry — and it is NOT a promise of live
 * booking/permit availability (we link to the official transaction surface, never
 * present cached inventory as bookable). Same draft-only contract as NPS.
 *
 * `fetchRaw` needs `RECREATION_GOV_API_KEY`. `normalize` is pure/fixture-tested.
 * Registry + legal review: docs/adr/0006.
 */
import slugify from "@/shared/utils/slugify";
import { recAreaSchema, ridbResponseSchema, type RecArea } from "./schema";
import type {
  NormalizedDestinationDraft,
  RawRecord,
  SourceAdapter,
  SourceRegistry,
} from "@/platform/ingestion/types";

const RIDB_BASE = "https://ridb.recreation.gov/api/v1";

const REGISTRY: SourceRegistry = {
  name: "Recreation.gov RIDB",
  baseUrl: RIDB_BASE,
  licence: "RIDB API terms — validate before copying media; preserve official IDs/URLs",
  attributionText: "Recreation information courtesy of Recreation.gov (RIDB)",
  termsUrl: "https://ridb.recreation.gov/docs",
  commercialUse:
    "Facility/permit metadata under RIDB terms; not a live booking/availability promise",
  refreshPolicy: "weekly",
  owner: "content",
};

function officialUrl(recAreaId: string): string {
  return `https://www.recreation.gov/camping/gateways/${recAreaId}`;
}

export class RecGovAdapter implements SourceAdapter {
  readonly registry = REGISTRY;
  readonly normalizerVersion = "recgov-v1";

  constructor(
    private readonly apiKey: string | undefined = process.env.RECREATION_GOV_API_KEY,
    private readonly query: string = "",
  ) {}

  async fetchRaw(): Promise<RawRecord[]> {
    if (!this.apiKey) {
      throw new Error(
        "RECREATION_GOV_API_KEY is not set — cannot fetch from RIDB (see docs/DEPENDENCIES.md).",
      );
    }
    const params = new URLSearchParams({ limit: "50" });
    if (this.query) params.set("query", this.query);
    const res = await fetch(`${RIDB_BASE}/recareas?${params.toString()}`, {
      headers: { apikey: this.apiKey },
    });
    if (!res.ok) throw new Error(`RIDB responded ${res.status} ${res.statusText}`);

    const json = ridbResponseSchema.parse(await res.json());
    return json.RECDATA.map((payload) => {
      const parsed = recAreaSchema.safeParse(payload);
      const externalId = parsed.success
        ? parsed.data.RecAreaID
        : String((payload as { RecAreaID?: unknown })?.RecAreaID ?? "unknown");
      return {
        externalId,
        canonicalUrl: parsed.success ? officialUrl(parsed.data.RecAreaID) : undefined,
        payload,
      };
    });
  }

  normalize(raw: RawRecord): NormalizedDestinationDraft {
    const area: RecArea = recAreaSchema.parse(raw.payload);
    const url = officialUrl(area.RecAreaID);
    return {
      sourceExternalId: area.RecAreaID,
      name: area.RecAreaName,
      slug: slugify(area.RecAreaName),
      point: { lat: area.RecAreaLatitude, lng: area.RecAreaLongitude },
      summaryDraft: area.RecAreaDescription || null,
      officialUrl: url,
      activities: [], // RIDB does not classify our launch activities reliably
      bestMonths: [],
      facts: [
        { field: "location", value: { lat: area.RecAreaLatitude, lng: area.RecAreaLongitude }, confidence: "confirmed" },
        { field: "officialUrl", value: url, confidence: "confirmed" },
      ],
      permit: {
        requirementType: "unknown",
        scope: "Check the official Recreation.gov page for permit/booking rules",
        officialUrl: url,
      },
    };
  }
}
