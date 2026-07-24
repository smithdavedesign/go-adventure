import { describe, expect, it, vi } from "vitest";
import { sanitizeProps } from "./events";
import { track } from "./track";

describe("sanitizeProps — PII / property allow-list", () => {
  it("keeps only allow-listed keys with primitive values", () => {
    const clean = sanitizeProps("destination_opened", {
      slug: "zion",
      email: "leak@example.com", // not allow-listed → dropped
      note: { secret: true }, // non-primitive → dropped
    });
    expect(clean).toEqual({ slug: "zion" });
  });

  it("drops everything for an event with no allowed props", () => {
    expect(sanitizeProps("search_submitted", { query: "backpacking" })).toEqual({});
  });
});

describe("track — consent gating", () => {
  it("drops analytics-category events without consent", () => {
    const sink = vi.fn();
    const sent = track("destination_opened", { slug: "zion" }, { analytics: false }, sink);
    expect(sent).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it("emits analytics events when consent is granted", () => {
    const sink = vi.fn();
    const sent = track("destination_opened", { slug: "zion" }, { analytics: true }, sink);
    expect(sent).toBe(true);
    expect(sink).toHaveBeenCalledWith("destination_opened", { slug: "zion" });
  });

  it("always emits necessary events regardless of consent", () => {
    const sink = vi.fn();
    const sent = track("signin_started", {}, { analytics: false }, sink);
    expect(sent).toBe(true);
    expect(sink).toHaveBeenCalled();
  });

  it("never forwards a non-allow-listed property to the sink", () => {
    const sink = vi.fn();
    track("save_completed", { slug: "zion", email: "leak@example.com" }, { analytics: true }, sink);
    expect(sink).toHaveBeenCalledWith("save_completed", { slug: "zion" });
    expect(JSON.stringify(sink.mock.calls)).not.toContain("leak@example.com");
  });
});
