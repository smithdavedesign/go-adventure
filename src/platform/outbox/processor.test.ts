import { describe, expect, it } from "vitest";
import { pathsForEvent } from "./processor";

describe("pathsForEvent", () => {
  it("revalidates home, explore, and the destination page on publish", () => {
    const paths = pathsForEvent("destination.published", { slug: "zion" });
    expect(paths).toContain("/");
    expect(paths).toContain("/explore");
    expect(paths).toContain("/destinations/zion");
  });

  it("handles a missing slug without crashing", () => {
    const paths = pathsForEvent("destination.published", {});
    expect(paths).toContain("/explore");
    expect(paths).not.toContain("/destinations/undefined");
  });

  it("falls back to home + explore for unknown event types", () => {
    expect(pathsForEvent("something.else", {})).toEqual(["/", "/explore"]);
  });
});
