/**
 * Raw-capture storage. The PRD requires preserving raw source captures in
 * restricted storage with checksums so published values are reproducible. In
 * production this is Cloudflare R2 (restricted bucket); for local dev we write
 * to a gitignored directory; tests use the in-memory store.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface RawStore {
  put(key: string, bytes: string): Promise<void>;
}

/** Writes raw captures under a local directory (gitignored). Dev only. */
export class LocalRawStore implements RawStore {
  constructor(private readonly baseDir: string) {}

  async put(key: string, bytes: string): Promise<void> {
    const path = join(this.baseDir, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, "utf8");
  }
}

/** Keeps captures in memory. Used by tests; asserts nothing is lost. */
export class MemoryRawStore implements RawStore {
  readonly items = new Map<string, string>();
  async put(key: string, bytes: string): Promise<void> {
    this.items.set(key, bytes);
  }
}
