import { describe, expect, it } from "vitest";
import { isAcceptableLicence, parseCommonsFileName } from "./wikimedia";

describe("parseCommonsFileName", () => {
  it("extracts the file from a thumb URL", () => {
    const url =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Half_Dome_%2850MP%29.jpg/3840px-Half_Dome_%2850MP%29.jpg";
    expect(parseCommonsFileName(url)).toBe("Half_Dome_(50MP).jpg");
  });
  it("extracts the file from a direct URL", () => {
    const url = "https://upload.wikimedia.org/wikipedia/commons/1/13/Tunnel_View.jpg";
    expect(parseCommonsFileName(url)).toBe("Tunnel_View.jpg");
  });
  it("returns null for a non-commons URL", () => {
    expect(parseCommonsFileName("https://example.com/x.jpg")).toBeNull();
  });
});

describe("isAcceptableLicence", () => {
  it.each(["CC BY-SA 3.0", "CC BY 2.0", "CC0", "Public domain", "PD-USGov"])(
    "accepts %s",
    (l) => expect(isAcceptableLicence(l)).toBe(true),
  );
  it.each(["Fair use", "All rights reserved", "Non-free", undefined])(
    "rejects %s",
    (l) => expect(isAcceptableLicence(l)).toBe(false),
  );
});
