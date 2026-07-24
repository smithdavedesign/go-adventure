import { describe, expect, it } from "vitest";
import { checksum, rawObjectKey } from "./checksum";

describe("checksum", () => {
  it("is stable for equal payloads", () => {
    const a = checksum({ parkCode: "zion", lat: 37.3 });
    const b = checksum({ parkCode: "zion", lat: 37.3 });
    expect(a).toBe(b);
  });

  it("changes when the payload changes", () => {
    expect(checksum({ v: 1 })).not.toBe(checksum({ v: 2 }));
  });
});

describe("rawObjectKey", () => {
  it("is deterministic and includes source, id, and checksum", () => {
    const key = rawObjectKey("NPS Data API", "zion", "abc123");
    expect(key).toBe("raw/nps-data-api/zion/abc123.json");
  });
});
