import { describe, it, expect } from "vitest";
import { cellKey, decideIngestion, COOLDOWN_MS, MIN_COVERAGE } from "./coverage";

describe("cellKey", () => {
  it("groups nearby coordinates into the same cell", () => {
    expect(cellKey(6.670, -1.565)).toBe(cellKey(6.672, -1.566));
  });
  it("separates far-apart coordinates", () => {
    expect(cellKey(6.67, -1.56)).not.toBe(cellKey(5.56, -0.19)); // Kumasi vs Accra
  });
});

describe("decideIngestion", () => {
  const now = 1_000_000_000_000;

  it("skips when no Google key is configured", () => {
    expect(decideIngestion({ nearbyCount: 0, hasKey: false }).reason).toBe("no-key");
  });

  it("skips when the area is already covered", () => {
    const d = decideIngestion({ nearbyCount: MIN_COVERAGE, hasKey: true });
    expect(d).toEqual({ ingest: false, reason: "covered" });
  });

  it("skips when the cell was ingested within the cooldown", () => {
    const d = decideIngestion({
      nearbyCount: 0,
      hasKey: true,
      now,
      lastIngestedAt: new Date(now - COOLDOWN_MS / 2),
    });
    expect(d).toEqual({ ingest: false, reason: "cooldown" });
  });

  it("ingests when sparse, keyed, and off cooldown", () => {
    const d = decideIngestion({
      nearbyCount: 1,
      hasKey: true,
      now,
      lastIngestedAt: new Date(now - COOLDOWN_MS * 2),
    });
    expect(d).toEqual({ ingest: true, reason: "sparse" });
  });

  it("ingests a brand-new area", () => {
    expect(decideIngestion({ nearbyCount: 0, hasKey: true }).ingest).toBe(true);
  });
});
