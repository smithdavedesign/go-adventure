/**
 * Point MapLibre GL at a self-hosted worker (see scripts/copy-maplibre-worker.mjs
 * for the full why). Without this, MapLibre v6's runtime-computed worker URL
 * resolves to a path the bundler never emitted → 404 → the worker fails to load
 * (a "non-JavaScript MIME type text/html" error) → vector tiles never decode →
 * blank map. Imported for its side effect by the map components before any map
 * is created.
 */
import { setWorkerUrl } from "maplibre-gl";

// The -dev worker pairs with the -dev shared chunk; the production build uses the
// non-dev pair. NODE_ENV is inlined by Next at build time.
const variant = process.env.NODE_ENV === "production" ? "" : "-dev";
setWorkerUrl(`/maplibre/maplibre-gl-worker${variant}.mjs`);
