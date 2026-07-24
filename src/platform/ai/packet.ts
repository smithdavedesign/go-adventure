/**
 * Source-packet construction + hashing.
 *
 * The PII guard lives here: `buildSourcePacket` accepts only explicitly-named
 * source fields and returns ONLY those. Any extra keys on the input (which must
 * never include user data anyway) are dropped, so nothing user-derived can reach
 * an AI provider even by accident. There's a unit test asserting exactly that.
 */
import { createHash } from "node:crypto";
import type { SourcePacket } from "./types";

/** Bump when the prompt or packet shape changes; recorded on every draft. */
export const PROMPT_VERSION = "summary-v1";

export function buildSourcePacket(input: {
  name: string;
  designation?: string | null;
  description?: string | null;
  sourceName: string;
}): SourcePacket {
  // Allow-list: exactly these four source-derived fields, nothing else.
  return {
    name: input.name,
    designation: input.designation ?? "",
    description: input.description ?? "",
    sourceName: input.sourceName,
  };
}

/** Deterministic hash of the packet + prompt version — proves what was sent. */
export function packetHash(packet: SourcePacket): string {
  const canonical = JSON.stringify({
    v: PROMPT_VERSION,
    name: packet.name,
    designation: packet.designation,
    description: packet.description,
    sourceName: packet.sourceName,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
