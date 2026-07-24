import { describe, expect, it } from "vitest";
import slugify from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Zion National Park")).toBe("zion-national-park");
  });
  it("strips diacritics", () => {
    expect(slugify("Cañon del Río")).toBe("canon-del-rio");
  });
  it("collapses and trims separators", () => {
    expect(slugify("  Mount   Whitney!!  ")).toBe("mount-whitney");
  });
  it("is stable for the same input", () => {
    expect(slugify("Great Smoky")).toBe(slugify("Great Smoky"));
  });
});
