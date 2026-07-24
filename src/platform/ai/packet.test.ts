import { describe, expect, it } from "vitest";
import { buildSourcePacket, packetHash, PROMPT_VERSION } from "./packet";

describe("buildSourcePacket — PII guard", () => {
  it("includes only the four allow-listed source fields", () => {
    const packet = buildSourcePacket({
      name: "Zion",
      designation: "National Park",
      description: "Cliffs and canyons.",
      sourceName: "NPS Data API",
      // Anything extra (which must never be user data anyway) is dropped:
      ...({ userEmail: "leak@example.com", userQuery: "secret" } as object),
    } as Parameters<typeof buildSourcePacket>[0]);

    expect(Object.keys(packet).sort()).toEqual([
      "description",
      "designation",
      "name",
      "sourceName",
    ]);
    expect(JSON.stringify(packet)).not.toContain("leak@example.com");
    expect(JSON.stringify(packet)).not.toContain("secret");
  });

  it("defaults missing optional fields to empty strings", () => {
    const packet = buildSourcePacket({ name: "X", sourceName: "S" });
    expect(packet.designation).toBe("");
    expect(packet.description).toBe("");
  });
});

describe("packetHash", () => {
  it("is stable for equal packets", () => {
    const p = { name: "A", designation: "B", description: "C", sourceName: "D" };
    expect(packetHash(p)).toBe(packetHash({ ...p }));
  });
  it("changes when the source text changes", () => {
    const base = { name: "A", designation: "B", description: "C", sourceName: "D" };
    expect(packetHash(base)).not.toBe(packetHash({ ...base, description: "C2" }));
  });
  it("has a stable prompt version marker", () => {
    expect(PROMPT_VERSION).toBe("summary-v1");
  });
});
