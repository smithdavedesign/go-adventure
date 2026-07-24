/**
 * AI-assisted editorial drafting contracts (Platform domain).
 *
 * Hard PRD rules encoded by these types:
 *  - AI only summarizes a SUPPLIED source packet and proposes tags. It cannot
 *    create facts or substitute for source research.
 *  - The packet is built exclusively from licensed SOURCE fields — never user
 *    data, queries, or PII (see packet.ts).
 *  - Output is schema-validated, attached to a content revision marked
 *    origin=ai_assisted with the prompt version + source-packet hash, and never
 *    auto-published.
 */

/** The only content sent to an AI provider — all source-derived, no user data. */
export type SourcePacket = {
  name: string;
  designation: string;
  /** Licensed source description to summarize. */
  description: string;
  sourceName: string;
};

/** Raw provider output (pre-validation). */
export type AiDraftOutput = {
  summary: string;
  tags: string[];
};

export interface AiDraftProvider {
  /** Identifier recorded on the revision, e.g. "gemini-1.5-flash" or "mock-v1". */
  readonly model: string;
  /** Summarize the packet and propose tags. Must not invent facts. */
  draft(packet: SourcePacket): Promise<AiDraftOutput>;
}
