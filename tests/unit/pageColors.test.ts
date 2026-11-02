import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_COLORS,
  PAGE_KEYS,
  isPageColor,
  readableTextColor,
} from "../../src/domain/pageColors";

describe("page colors", () => {
  it("defines a default for every page", () => {
    expect(PAGE_KEYS).toHaveLength(8);
    expect(new Set(Object.values(DEFAULT_PAGE_COLORS)).size).toBe(8);
  });

  it("accepts only six-digit hex colors", () => {
    expect(isPageColor("#426a54")).toBe(true);
    expect(isPageColor("#fff")).toBe(false);
    expect(isPageColor("green")).toBe(false);
  });

  it("selects dark text for very light accents and light text otherwise", () => {
    expect(readableTextColor("#f5edca")).toBe("#172019");
    expect(readableTextColor("#426a54")).toBe("#f8fbf8");
  });
});
