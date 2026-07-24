import { describe, expect, it } from "vitest";
import { aiDraftOutputSchema } from "./schema";

describe("aiDraftOutputSchema", () => {
  it("accepts a well-formed suggestion", () => {
    const r = aiDraftOutputSchema.safeParse({
      summary: "A short editorial summary.",
      tags: ["desert", "canyon"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects an empty summary", () => {
    expect(
      aiDraftOutputSchema.safeParse({ summary: "", tags: [] }).success,
    ).toBe(false);
  });

  it("rejects too many tags (bounds a misbehaving model)", () => {
    const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    expect(
      aiDraftOutputSchema.safeParse({ summary: "ok", tags }).success,
    ).toBe(false);
  });

  it("rejects a non-string summary", () => {
    expect(
      aiDraftOutputSchema.safeParse({ summary: 123, tags: [] }).success,
    ).toBe(false);
  });
});
