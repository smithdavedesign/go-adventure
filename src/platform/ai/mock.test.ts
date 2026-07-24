import { describe, expect, it } from "vitest";
import { MockAiProvider } from "./mock";
import { aiDraftOutputSchema } from "./schema";

const provider = new MockAiProvider();
const packet = {
  name: "Zion National Park",
  designation: "National Park",
  description: "Massive sandstone cliffs soar into a brilliant sky. Rivers carve slot canyons.",
  sourceName: "NPS Data API",
};

describe("MockAiProvider", () => {
  it("produces schema-valid output", async () => {
    const out = await provider.draft(packet);
    expect(() => aiDraftOutputSchema.parse(out)).not.toThrow();
  });

  it("summarizes from the source text and flags the need for review", async () => {
    const out = await provider.draft(packet);
    expect(out.summary).toMatch(/sandstone cliffs/i); // derived from source
    expect(out.summary).toMatch(/editorial review/i);
  });

  it("is deterministic", async () => {
    const a = await provider.draft(packet);
    const b = await provider.draft(packet);
    expect(a).toEqual(b);
  });

  it("does not fabricate facts absent from the packet", async () => {
    const out = await provider.draft({
      name: "Test",
      designation: "",
      description: "A short description.",
      sourceName: "S",
    });
    // No invented difficulty/permit/weather words.
    expect(out.summary.toLowerCase()).not.toMatch(/permit|difficult|weather|budget/);
  });
});
