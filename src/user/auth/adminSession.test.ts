import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./adminSession";

const NOW = 1_770_000_000_000; // fixed ms

describe("admin session token", () => {
  it("verifies a freshly issued token", () => {
    const token = createSessionToken(NOW);
    expect(verifySessionToken(token, NOW)).toBe(true);
  });

  it("rejects an expired token", () => {
    const token = createSessionToken(NOW);
    // 9 hours later (max age is 8h)
    expect(verifySessionToken(token, NOW + 9 * 60 * 60 * 1000)).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken(NOW);
    const tampered = token.replace(/.$/, (c) => (c === "a" ? "b" : "a"));
    expect(verifySessionToken(tampered, NOW)).toBe(false);
  });

  it("rejects malformed and empty tokens", () => {
    expect(verifySessionToken(undefined, NOW)).toBe(false);
    expect(verifySessionToken("", NOW)).toBe(false);
    expect(verifySessionToken("garbage", NOW)).toBe(false);
    expect(verifySessionToken("a.b", NOW)).toBe(false);
  });
});
