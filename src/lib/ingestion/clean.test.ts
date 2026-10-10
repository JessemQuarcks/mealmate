import { describe, it, expect } from "vitest";
import { cleanText, parseRating, parseRatingCount, slugify } from "./clean";
import { normalizeLocalRecord } from "./localSource";

describe("cleanText", () => {
  it("repairs common mojibake sequences", () => {
    expect(cleanText("Closes soon â‹… 11â€¯pm")).toBe("Closes soon · 11 pm");
    expect(cleanText("Â·")).toBe("·");
  });
  it("collapses whitespace and trims", () => {
    expect(cleanText("  a\t\t b   c ")).toBe("a b c");
  });
  it("handles empty input", () => {
    expect(cleanText(undefined)).toBe("");
    expect(cleanText(null)).toBe("");
  });
});

describe("parseRating", () => {
  it("parses and clamps to 0..5", () => {
    expect(parseRating("4.2")).toBeCloseTo(4.2);
    expect(parseRating(9)).toBe(5);
    expect(parseRating(-1)).toBe(0);
  });
  it("returns undefined for junk", () => {
    expect(parseRating("")).toBeUndefined();
    expect(parseRating("n/a")).toBeUndefined();
  });
});

describe("parseRatingCount", () => {
  it("takes the magnitude of noisy counts", () => {
    expect(parseRatingCount("-118")).toBe(118);
    expect(parseRatingCount(42)).toBe(42);
    expect(parseRatingCount("")).toBe(0);
  });
});

describe("slugify", () => {
  it("produces url-safe slugs", () => {
    expect(slugify("Super-Mc Restaurant")).toBe("super-mc-restaurant");
    expect(slugify("  Café  &  Bar ")).toBe("caf-bar");
  });
});

describe("normalizeLocalRecord", () => {
  it("maps a legacy record to the ingestion shape with GeoJSON order", () => {
    const result = normalizeLocalRecord({
      id: 7,
      name: "Super-Mc Restaurant",
      ratings: "4.2",
      rating_by_person: "-118",
      category: "Restaurant",
      google_map_src: "https://img",
      coord: { lat: 6.677, lng: -1.587 },
      products: [{ id: "1", name: "Meal 1", price: 12, image: "/a.webp" }],
    });

    expect(result.externalId).toBe("local-7");
    expect(result.source).toBe("local");
    expect(result.rating).toBeCloseTo(4.2);
    expect(result.ratingCount).toBe(118);
    // GeoJSON order is [lng, lat].
    expect(result.coordinates).toEqual([-1.587, 6.677]);
    expect(result.menu).toEqual([
      { externalId: "1", name: "Meal 1", price: 12, image: "/a.webp" },
    ]);
  });
});
