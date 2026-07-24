/**
 * AI-assisted drafting workflow.
 *
 * Builds a source packet (source-derived fields only), calls the provider,
 * validates the output, and attaches the suggestion to the content revision with
 * the AI provenance markers (origin=ai_assisted, promptVersion, sourcePacketHash).
 * It NEVER publishes and NEVER writes into factual fields — the suggestion sits
 * as `body.aiSuggestion` for a human editor to accept, edit, or discard.
 */
import { prisma } from "@/shared/config/db";
import { buildSourcePacket, packetHash, PROMPT_VERSION } from "./packet";
import { aiDraftOutputSchema } from "./schema";
import { MockAiProvider } from "./mock";
import { GeminiAiProvider } from "./gemini";
import type { AiDraftProvider } from "./types";

export type AiSuggestion = {
  summary: string;
  tags: string[];
  model: string;
  promptVersion: string;
  packetHash: string;
};

/** Use Gemini when a key is present; otherwise the deterministic mock (dev). */
export function defaultAiProvider(): AiDraftProvider {
  return process.env.GEMINI_API_KEY
    ? new GeminiAiProvider()
    : new MockAiProvider();
}

export type DraftResult =
  | { ok: true; suggestion: AiSuggestion }
  | { ok: false; error: string };

export async function draftWithAi(
  revisionId: string,
  provider: AiDraftProvider = defaultAiProvider(),
): Promise<DraftResult> {
  const revision = await prisma.contentRevision.findUnique({
    where: { id: revisionId },
    include: { sourceRecord: { include: { source: true } } },
  });
  if (!revision) return { ok: false, error: "Revision not found." };

  const body = (revision.body ?? {}) as Record<string, unknown>;
  const designation =
    (body.facts as { field: string; value: unknown }[] | undefined)?.find(
      (f) => f.field === "designation",
    )?.value ?? "";

  const packet = buildSourcePacket({
    name: String(body.name ?? ""),
    designation: String(designation ?? ""),
    description: String(body.summaryDraft ?? body.summary ?? ""),
    sourceName: revision.sourceRecord?.source.name ?? "editorial",
  });

  let output;
  try {
    const raw = await provider.draft(packet);
    output = aiDraftOutputSchema.parse(raw); // reject anything malformed
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const hash = packetHash(packet);
  const suggestion: AiSuggestion = {
    summary: output.summary,
    tags: output.tags,
    model: provider.model,
    promptVersion: PROMPT_VERSION,
    packetHash: hash,
  };

  // Attach the suggestion + AI provenance markers. Does NOT touch factual
  // fields and does NOT change reviewStatus (stays in review).
  await prisma.contentRevision.update({
    where: { id: revisionId },
    data: {
      body: { ...body, aiSuggestion: suggestion } as never,
      origin: "ai_assisted",
      promptVersion: PROMPT_VERSION,
      sourcePacketHash: hash,
    },
  });

  return { ok: true, suggestion };
}
