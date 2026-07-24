import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, clientKey, rateLimit } from "./rateLimit";

beforeEach(() => __resetRateLimits());

describe("rateLimit", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const key = "k";
    expect(rateLimit(key, 3, 1000, 0).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000, 0).allowed).toBe(true);
    expect(rateLimit(key, 3, 1000, 0).allowed).toBe(true);
    const blocked = rateLimit(key, 3, 1000, 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window elapses", () => {
    rateLimit("k", 1, 1000, 0);
    expect(rateLimit("k", 1, 1000, 0).allowed).toBe(false);
    // window passed
    expect(rateLimit("k", 1, 1000, 1001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 1000, 0).allowed).toBe(true);
    expect(rateLimit("b", 1, 1000, 0).allowed).toBe(true);
    expect(rateLimit("a", 1, 1000, 0).allowed).toBe(false);
  });
});

describe("clientKey", () => {
  it("derives a scoped key from x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientKey(req, "login")).toBe("login:203.0.113.7");
  });
  it("falls back when no ip header is present", () => {
    expect(clientKey(new Request("http://x"), "login")).toBe("login:unknown");
  });
});
