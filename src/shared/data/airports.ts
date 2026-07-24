/**
 * Curated major/regional US airports for "nearby airports" (PRD destination
 * Launch Set). Static dataset (no API) — reliable and free. Distances are great-
 * circle from the destination point; airfare/travel-time is out of scope (the
 * PRD excludes airfare from budget unless computed from a specific origin).
 */
export type Airport = { code: string; name: string; lat: number; lng: number };

export const AIRPORTS: Airport[] = [
  // California
  { code: "SFO", name: "San Francisco Intl", lat: 37.6213, lng: -122.379 },
  { code: "SJC", name: "San José Mineta", lat: 37.3626, lng: -121.929 },
  { code: "LAX", name: "Los Angeles Intl", lat: 33.9416, lng: -118.4085 },
  { code: "SAN", name: "San Diego Intl", lat: 32.7338, lng: -117.1933 },
  { code: "SMF", name: "Sacramento Intl", lat: 38.6954, lng: -121.5908 },
  { code: "FAT", name: "Fresno Yosemite Intl", lat: 36.7762, lng: -119.7181 },
  { code: "RNO", name: "Reno-Tahoe Intl", lat: 39.4991, lng: -119.768 },
  { code: "MRY", name: "Monterey Regional", lat: 36.587, lng: -121.843 },
  // Nevada / Utah
  { code: "LAS", name: "Harry Reid Intl (Las Vegas)", lat: 36.084, lng: -115.1537 },
  { code: "SLC", name: "Salt Lake City Intl", lat: 40.7899, lng: -111.9791 },
  { code: "CDC", name: "Cedar City Regional", lat: 37.701, lng: -113.0989 },
  { code: "SGU", name: "St. George Regional", lat: 37.0364, lng: -113.5103 },
  { code: "CNY", name: "Canyonlands Field (Moab)", lat: 38.755, lng: -109.7546 },
  // Arizona
  { code: "PHX", name: "Phoenix Sky Harbor", lat: 33.4342, lng: -112.0116 },
  { code: "TUS", name: "Tucson Intl", lat: 32.1161, lng: -110.941 },
  { code: "FLG", name: "Flagstaff Pulliam", lat: 35.1385, lng: -111.6711 },
  { code: "GCN", name: "Grand Canyon National Park", lat: 35.9524, lng: -112.1469 },
  // Colorado / New Mexico
  { code: "DEN", name: "Denver Intl", lat: 39.8561, lng: -104.6737 },
  { code: "COS", name: "Colorado Springs", lat: 38.8058, lng: -104.7008 },
  { code: "GJT", name: "Grand Junction Regional", lat: 39.1224, lng: -108.5267 },
  { code: "MTJ", name: "Montrose Regional", lat: 38.5098, lng: -107.8942 },
  { code: "ABQ", name: "Albuquerque Sunport", lat: 35.0402, lng: -106.6092 },
  { code: "ALS", name: "San Luis Valley (Alamosa)", lat: 37.435, lng: -105.8667 },
  // Wyoming / Montana / Idaho
  { code: "JAC", name: "Jackson Hole", lat: 43.6073, lng: -110.7377 },
  { code: "COD", name: "Yellowstone Regional (Cody)", lat: 44.5202, lng: -109.0238 },
  { code: "BZN", name: "Bozeman Yellowstone Intl", lat: 45.7775, lng: -111.153 },
  { code: "WYS", name: "Yellowstone (West Yellowstone)", lat: 44.6884, lng: -111.1177 },
  { code: "FCA", name: "Glacier Park Intl (Kalispell)", lat: 48.3105, lng: -114.256 },
  { code: "MSO", name: "Missoula Montana", lat: 46.9163, lng: -114.0906 },
  { code: "BIL", name: "Billings Logan Intl", lat: 45.8077, lng: -108.5429 },
  // Pacific NW
  { code: "SEA", name: "Seattle-Tacoma Intl", lat: 47.4502, lng: -122.3088 },
  { code: "PDX", name: "Portland Intl", lat: 45.5887, lng: -122.5975 },
  { code: "MFR", name: "Rogue Valley (Medford)", lat: 42.3742, lng: -122.8735 },
  { code: "RDM", name: "Redmond Muni (Bend)", lat: 44.2541, lng: -121.15 },
  { code: "GEG", name: "Spokane Intl", lat: 47.6199, lng: -117.5338 },
  { code: "ACV", name: "California Redwood Coast (Arcata)", lat: 40.9781, lng: -124.1086 },
  // Texas / South
  { code: "ELP", name: "El Paso Intl", lat: 31.8072, lng: -106.3778 },
  { code: "MAF", name: "Midland Intl", lat: 31.9425, lng: -102.2019 },
  { code: "RAP", name: "Rapid City Regional", lat: 44.0453, lng: -103.0574 },
  // Northeast / Appalachia
  { code: "BGR", name: "Bangor Intl", lat: 44.8074, lng: -68.8281 },
  { code: "PWM", name: "Portland Intl Jetport (ME)", lat: 43.6462, lng: -70.3093 },
  { code: "BHB", name: "Hancock County-Bar Harbor", lat: 44.4498, lng: -68.3615 },
  { code: "TYS", name: "Knoxville McGhee Tyson", lat: 35.811, lng: -83.994 },
  { code: "AVL", name: "Asheville Regional", lat: 35.4362, lng: -82.5418 },
  { code: "CLT", name: "Charlotte Douglas Intl", lat: 35.214, lng: -80.9431 },
  { code: "IAD", name: "Washington Dulles Intl", lat: 38.9531, lng: -77.4565 },
  { code: "CHO", name: "Charlottesville-Albemarle", lat: 38.1386, lng: -78.4529 },
  { code: "SHD", name: "Shenandoah Valley", lat: 38.2638, lng: -78.8964 },
  { code: "RIC", name: "Richmond Intl", lat: 37.5052, lng: -77.3197 },
];

function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export type NearbyAirport = Airport & { distanceMiles: number };

/** The `n` nearest airports to a point, closest first. */
export function nearestAirports(
  point: { lat: number; lng: number },
  n = 3,
): NearbyAirport[] {
  return AIRPORTS.map((a) => ({
    ...a,
    distanceMiles: Math.round(haversineMiles(point, a)),
  }))
    .sort((x, y) => x.distanceMiles - y.distanceMiles)
    .slice(0, n);
}
