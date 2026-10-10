/**
 * The scraped restaurant data was saved with UTF-8 bytes re-interpreted as
 * Windows-1252, which left mojibake sequences like `â€¯` (narrow no-break space)
 * and `Â·` (middot) throughout. These helpers repair the common sequences and
 * normalise whitespace. A targeted map is used rather than a blanket re-decode
 * so clean ASCII is never corrupted.
 */
const MOJIBAKE: Array<[RegExp, string]> = [
  [/â€¯/g, " "], // narrow no-break space
  [/â€‰/g, " "], // thin space
  [/Â /g, " "], // Â + nbsp
  [/â‹…/g, "·"], // dot operator
  [/Â·/g, "·"],
  [/â€“/g, "–"],
  [/â€”/g, "—"],
  [/â€™/g, "’"],
  [/â€˜/g, "‘"],
  [/â€œ/g, "“"],
  [/â€\u009d/g, "”"],
  [/â€/g, "”"],
  [/Ã©/g, "é"],
  [/Â/g, ""], // stray Â left over
];

export function cleanText(input: string | undefined | null): string {
  if (!input) return "";
  let out = input;
  for (const [pattern, replacement] of MOJIBAKE) {
    out = out.replace(pattern, replacement);
  }
  // Collapse runs of whitespace (including tabs from the original paste).
  return out.replace(/\s+/g, " ").trim();
}

/** Parse a rating like "4.2" into a number in [0, 5], or undefined. */
export function parseRating(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(5, Math.max(0, n));
}

/** Rating counts in the source are noisy (e.g. "-118"); take the magnitude. */
export function parseRatingCount(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const n = typeof value === "number" ? value : parseInt(value, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.abs(n);
}

/** A URL-safe slug from a restaurant name. */
export function slugify(name: string): string {
  return cleanText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
