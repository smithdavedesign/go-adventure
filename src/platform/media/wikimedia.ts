/**
 * Wikimedia hero-image lookup (server-only).
 *
 * Two steps: (1) the Wikipedia REST summary gives a park's lead image (a good
 * scenic hero); (2) the Commons imageinfo API gives that file's licence + author
 * so we can store proper attribution and only accept openly-licensed images
 * (PRD media rights: store creator/source/licence/credit; reject unknown).
 *
 * `parseCommonsFileName` and `isAcceptableLicence` are pure/testable.
 */
const WP_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const UA = "TravelRoamer/1.0 (+https://travel-roamer.com; content@travel-roamer.com)";

export type HeroImage = {
  imageUrl: string;
  fileName: string;
  licence: string;
  licenceUrl: string | null;
  creatorCredit: string;
  sourcePageUrl: string;
};

/** Derive the Commons file name from an upload.wikimedia.org URL (thumb or direct). */
export function parseCommonsFileName(url: string): string | null {
  const parts = url.split("/");
  const i = parts.indexOf("commons");
  if (i === -1) return null;
  const name = parts[i + 1] === "thumb" ? parts[i + 4] : parts[parts.length - 1];
  if (!name) return null;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

/** Accept CC and public-domain licences; reject non-free / unknown. */
export function isAcceptableLicence(licence: string | undefined): boolean {
  if (!licence) return false;
  const l = licence.toLowerCase();
  if (/fair use|non-free|all rights reserved/.test(l)) return false;
  return /cc[\s-]?(by|0|zero)|public domain|pd|cc0/.test(l);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a HeroImage from a Commons file's imageinfo, or null if not open-licensed. */
async function heroFromCommonsFile(fileName: string): Promise<HeroImage | null> {
  const infoRes = await fetch(
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent(
      "File:" + fileName,
    )}`,
    { headers: { "User-Agent": UA } },
  );
  if (!infoRes.ok) return null;
  const info = (await infoRes.json()) as {
    query?: {
      pages?: Record<
        string,
        { imageinfo?: { url?: string; extmetadata?: Record<string, { value?: string }> }[] }
      >;
    };
  };
  const page = Object.values(info.query?.pages ?? {})[0];
  const imageinfo = page?.imageinfo?.[0];
  const meta = imageinfo?.extmetadata ?? {};
  const licence = meta.LicenseShortName?.value ?? "";
  const imageUrl = imageinfo?.url;
  if (!imageUrl || !isAcceptableLicence(licence)) return null;

  return {
    imageUrl,
    fileName,
    licence,
    licenceUrl: meta.LicenseUrl?.value ?? null,
    creatorCredit: meta.Artist?.value ? stripHtml(meta.Artist.value) : "Wikimedia Commons",
    sourcePageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
  };
}

/**
 * Fetch a hero from a specific Commons file (validated through the same licence
 * gate). Used to override parks whose Wikipedia lead image isn't openly licensed
 * (e.g. Glacier), so they get a real photo instead of the gradient fallback.
 */
export async function fetchHeroByCommonsFile(
  fileName: string,
): Promise<HeroImage | null> {
  return heroFromCommonsFile(fileName);
}

/** Titles that are clearly not scenic photos (maps, diagrams, signs, logos). */
const NON_PHOTO = /\b(map|diagram|logo|sign|chart|plan|seal|flag|panorama\.svg)\b|\.svg$/i;

/**
 * Find several openly-licensed landscape photos for a park (gallery). Two calls:
 * a Commons file search, then one batched imageinfo lookup; filters to CC/PD
 * landscape images and skips maps/diagrams and an excluded file (the hero).
 */
export async function fetchParkPhotos(
  query: string,
  count = 6,
  excludeFileName?: string,
): Promise<HeroImage[]> {
  const searchRes = await fetch(
    `${COMMONS_API}?action=query&format=json&list=search&srnamespace=6&srlimit=25&srsearch=${encodeURIComponent(
      query,
    )}`,
    { headers: { "User-Agent": UA } },
  );
  if (!searchRes.ok) return [];
  const search = (await searchRes.json()) as {
    query?: { search?: { title: string }[] };
  };
  const titles = (search.query?.search ?? [])
    .map((s) => s.title)
    .filter((t) => !NON_PHOTO.test(t));
  if (titles.length === 0) return [];

  const infoRes = await fetch(
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url|size&titles=${encodeURIComponent(
      titles.join("|"),
    )}`,
    { headers: { "User-Agent": UA } },
  );
  if (!infoRes.ok) return [];
  const info = (await infoRes.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: {
            url?: string;
            width?: number;
            height?: number;
            extmetadata?: Record<string, { value?: string }>;
          }[];
        }
      >;
    };
  };

  const out: HeroImage[] = [];
  const seen = new Set<string>();
  for (const page of Object.values(info.query?.pages ?? {})) {
    const ii = page.imageinfo?.[0];
    const title = page.title ?? "";
    const fileName = title.replace(/^File:/, "");
    if (!ii?.url || !fileName) continue;
    if (excludeFileName && fileName === excludeFileName) continue;
    if (NON_PHOTO.test(fileName) || seen.has(fileName)) continue;
    // Landscape and a reasonable size — skips portraits, icons, thumbnails.
    if (!ii.width || !ii.height || ii.width < ii.height || ii.width < 1200) continue;
    const licence = ii.extmetadata?.LicenseShortName?.value ?? "";
    if (!isAcceptableLicence(licence)) continue;
    seen.add(fileName);
    out.push({
      imageUrl: ii.url,
      fileName,
      licence,
      licenceUrl: ii.extmetadata?.LicenseUrl?.value ?? null,
      creatorCredit: ii.extmetadata?.Artist?.value
        ? stripHtml(ii.extmetadata.Artist.value)
        : "Wikimedia Commons",
      sourcePageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
    });
    if (out.length >= count) break;
  }
  return out;
}

/** Find an openly-licensed hero image for a park, or null. */
export async function fetchParkHero(
  wikipediaTitle: string,
): Promise<HeroImage | null> {
  const summaryRes = await fetch(
    `${WP_SUMMARY}/${encodeURIComponent(wikipediaTitle.replace(/ /g, "_"))}`,
    { headers: { "User-Agent": UA } },
  );
  if (!summaryRes.ok) return null;
  const summary = (await summaryRes.json()) as {
    originalimage?: { source?: string };
  };
  const imageUrl = summary.originalimage?.source;
  if (!imageUrl) return null;

  const fileName = parseCommonsFileName(imageUrl);
  if (!fileName) return null;

  const infoRes = await fetch(
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent(
      "File:" + fileName,
    )}`,
    { headers: { "User-Agent": UA } },
  );
  if (!infoRes.ok) return null;
  const info = (await infoRes.json()) as {
    query?: { pages?: Record<string, { imageinfo?: { extmetadata?: Record<string, { value?: string }> }[] }> };
  };
  const page = Object.values(info.query?.pages ?? {})[0];
  const meta = page?.imageinfo?.[0]?.extmetadata ?? {};
  const licence = meta.LicenseShortName?.value ?? "";
  if (!isAcceptableLicence(licence)) return null;

  return {
    imageUrl,
    fileName,
    licence,
    licenceUrl: meta.LicenseUrl?.value ?? null,
    creatorCredit: meta.Artist?.value ? stripHtml(meta.Artist.value) : "Wikimedia Commons",
    sourcePageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
  };
}
