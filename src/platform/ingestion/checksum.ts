/**
 * Stable content-addressing for raw source captures. The checksum lets us prove
 * a published value can be reproduced from the exact bytes we ingested, and the
 * object key is deterministic so re-ingesting identical bytes is a no-op.
 */
import { createHash } from "node:crypto";

/** SHA-256 of a canonicalized JSON payload. Deterministic for equal objects. */
export function checksum(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/** Restricted-storage key for a raw capture. Immutable — includes the checksum. */
export function rawObjectKey(
  sourceName: string,
  externalId: string,
  sum: string,
): string {
  const safeSource = sourceName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const safeId = externalId.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `raw/${safeSource}/${safeId}/${sum}.json`;
}
