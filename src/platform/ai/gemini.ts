/**
 * Gemini Flash provider (editorial assistance only).
 *
 * Sends the source packet with a strict instruction to summarize ONLY the
 * supplied text and never invent facts, and to return JSON. The response is
 * schema-validated by the caller. Requires GEMINI_API_KEY; throws clearly if
 * absent so the caller can fall back to the mock in dev.
 *
 * Provider/model/version, cost cap, retention terms, and evaluation set belong
 * in docs/adr/0007 before this is enabled against real content in production.
 */
import { aiDraftOutputSchema } from "./schema";
import type { AiDraftOutput, AiDraftProvider, SourcePacket } from "./types";

const MODEL = "gemini-1.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_INSTRUCTION =
  "You are an editorial assistant. Summarize ONLY the provided source text for an " +
  "outdoor-adventure destination. Do NOT invent facts, permits, difficulty, weather, " +
  "or any detail not present in the source. Return strict JSON: " +
  '{"summary": string (<= 3 sentences), "tags": string[] (<= 6 short tags)}.';

export class GeminiAiProvider implements AiDraftProvider {
  readonly model = MODEL;

  constructor(private readonly apiKey: string | undefined = process.env.GEMINI_API_KEY) {}

  async draft(packet: SourcePacket): Promise<AiDraftOutput> {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set — cannot use the Gemini provider (see docs/DEPENDENCIES.md).",
      );
    }

    const prompt = [
      SYSTEM_INSTRUCTION,
      "",
      `Source: ${packet.sourceName}`,
      `Name: ${packet.name}`,
      `Designation: ${packet.designation}`,
      `Source text: ${packet.description}`,
    ].join("\n");

    const res = await fetch(`${ENDPOINT}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini responded ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // Validate the model's JSON against our schema; reject anything malformed.
    return aiDraftOutputSchema.parse(JSON.parse(text));
  }
}
