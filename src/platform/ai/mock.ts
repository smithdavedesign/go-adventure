/**
 * Deterministic mock provider. Used in dev/test and as the fallback when no
 * Gemini key is configured, so the whole AI-assist workflow is exercisable
 * offline. Deterministic (no randomness) so tests are stable.
 *
 * It only reshapes the supplied packet — it invents nothing — mirroring the
 * contract the real provider is held to.
 */
import type { AiDraftOutput, AiDraftProvider, SourcePacket } from "./types";

export class MockAiProvider implements AiDraftProvider {
  readonly model = "mock-v1";

  async draft(packet: SourcePacket): Promise<AiDraftOutput> {
    const firstSentence =
      packet.description.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
    const summary = firstSentence
      ? `${firstSentence} (AI-assisted draft — editorial review required.)`
      : `${packet.name}: draft summary pending editorial review.`;

    // Tags from distinctive words in the name/designation — no invented facts.
    const tags = Array.from(
      new Set(
        `${packet.name} ${packet.designation}`
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3),
      ),
    ).slice(0, 6);

    return { summary, tags };
  }
}
