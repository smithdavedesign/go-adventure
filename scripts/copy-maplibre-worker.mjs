/**
 * Copy MapLibre GL's worker + shared chunks into public/ so they're served at a
 * stable, same-origin URL.
 *
 * Why: MapLibre v6 is ESM-only and loads its tile-decoding Web Worker from a URL
 * it computes at runtime as `new URL('./maplibre-gl-worker.mjs', import.meta.url)`.
 * The filename is chosen by a ternary, so bundlers (Turbopack, webpack) can't
 * statically rewrite it to the hashed asset they emit — the computed URL 404s,
 * the worker dies, and vector tiles never render (blank map). We serve our own
 * copy from /public/maplibre and point `setWorkerUrl` at it (see
 * src/shared/maplibre.ts). Runs from postinstall so every environment has it.
 */
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist");
const dest = join(root, "public", "maplibre");

// Both the production and -dev variants; each worker imports its matching shared
// chunk by a relative path, so they must sit together in the same directory.
const files = [
  "maplibre-gl-worker.mjs",
  "maplibre-gl-shared.mjs",
  "maplibre-gl-worker-dev.mjs",
  "maplibre-gl-shared-dev.mjs",
];

if (!existsSync(src)) {
  console.warn("maplibre-gl not installed yet; skipping worker copy.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
let n = 0;
for (const f of files) {
  const from = join(src, f);
  if (existsSync(from)) {
    copyFileSync(from, join(dest, f));
    n++;
  }
}
console.log(`Copied ${n} MapLibre worker files to public/maplibre/`);
