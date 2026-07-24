import { describe, expect, it } from "vitest";
import {
  isFresh,
  pickWinningFact,
  resolveFacts,
  resolvePermit,
  type FactLike,
  type PermitLike,
} from "./precedence";

const NOW = new Date("2026-07-23T00:00:00Z");
const PAST = new Date("2026-07-01T00:00:00Z");
const FUTURE = new Date("2026-08-01T00:00:00Z");

function fact(overrides: Partial<FactLike>): FactLike {
  return {
    field: "difficulty",
    value: "moderate",
    confidence: "editorial",
    verifiedAt: PAST,
    expiresAt: null,
    ...overrides,
  };
}

describe("isFresh", () => {
  it("treats a null expiry as always fresh", () => {
    expect(isFresh({ expiresAt: null }, NOW)).toBe(true);
  });
  it("is stale once expiry has passed", () => {
    expect(isFresh({ expiresAt: PAST }, NOW)).toBe(false);
  });
  it("is fresh while expiry is in the future", () => {
    expect(isFresh({ expiresAt: FUTURE }, NOW)).toBe(true);
  });
});

describe("pickWinningFact — precedence", () => {
  it("prefers higher confidence (confirmed > editorial > uncertain)", () => {
    const winner = pickWinningFact(
      [
        fact({ confidence: "uncertain", value: "hard" }),
        fact({ confidence: "confirmed", value: "easy" }),
        fact({ confidence: "editorial", value: "moderate" }),
      ],
      NOW,
    );
    expect(winner?.value).toBe("easy");
  });

  it("breaks a confidence tie by most recent verification", () => {
    const winner = pickWinningFact(
      [
        fact({ confidence: "editorial", value: "old", verifiedAt: PAST }),
        fact({
          confidence: "editorial",
          value: "new",
          verifiedAt: new Date("2026-07-20T00:00:00Z"),
        }),
      ],
      NOW,
    );
    expect(winner?.value).toBe("new");
  });

  it("drops expired assertions and never shows them", () => {
    const winner = pickWinningFact(
      [
        fact({ confidence: "confirmed", value: "expired", expiresAt: PAST }),
        fact({ confidence: "editorial", value: "current", expiresAt: FUTURE }),
      ],
      NOW,
    );
    // The higher-confidence fact is expired, so the fresh editorial one wins.
    expect(winner?.value).toBe("current");
  });

  it("returns null when every assertion is expired", () => {
    expect(
      pickWinningFact([fact({ expiresAt: PAST })], NOW),
    ).toBeNull();
  });
});

describe("resolveFacts", () => {
  it("resolves each field independently by precedence, omitting expired-only fields", () => {
    const resolved = resolveFacts(
      [
        fact({ field: "difficulty", confidence: "confirmed", value: "easy" }),
        fact({ field: "difficulty", confidence: "uncertain", value: "hard" }),
        fact({ field: "permit", confidence: "confirmed", value: "required", expiresAt: PAST }),
        fact({ field: "budget", confidence: "editorial", value: 500 }),
      ],
      NOW,
    );
    expect(resolved).toEqual({ difficulty: "easy", budget: 500 });
    expect(resolved).not.toHaveProperty("permit"); // only assertion was expired
  });
});

describe("resolvePermit", () => {
  function permit(overrides: Partial<PermitLike>): PermitLike {
    return {
      requirementType: "reservation",
      lastVerifiedAt: PAST,
      expiresAt: null,
      ...overrides,
    };
  }

  it("returns the freshest non-expired permit", () => {
    const p = resolvePermit(
      [
        permit({ requirementType: "quota", lastVerifiedAt: PAST }),
        permit({
          requirementType: "reservation",
          lastVerifiedAt: new Date("2026-07-22T00:00:00Z"),
        }),
      ],
      NOW,
    );
    expect(p?.requirementType).toBe("reservation");
  });

  it("returns null when there is no current permit info (never implies 'none')", () => {
    expect(
      resolvePermit([permit({ expiresAt: PAST })], NOW),
    ).toBeNull();
  });
});
