import { describe, it, expect } from "vitest";
import { buildPaymentReference, isValidReference } from "./reference";

describe("buildPaymentReference", () => {
  it("produces a reference this module recognises", () => {
    expect(isValidReference(buildPaymentReference())).toBe(true);
  });

  it("is unique across rapid successive calls", () => {
    const refs = new Set(Array.from({ length: 1000 }, () => buildPaymentReference()));
    expect(refs.size).toBe(1000);
  });

  it("encodes the timestamp so later references sort after earlier ones", () => {
    const early = buildPaymentReference(1_000_000_000_000);
    const late = buildPaymentReference(2_000_000_000_000);
    expect(early < late).toBe(true);
  });
});

describe("isValidReference", () => {
  it("rejects foreign or malformed references", () => {
    expect(isValidReference("")).toBe(false);
    expect(isValidReference("ref-12345")).toBe(false);
    expect(isValidReference(12345)).toBe(false);
    expect(isValidReference(null)).toBe(false);
  });
});
