import { describe, expect, it } from "vitest";
import { computeWeightedRollup } from "./rollup.js";

describe("rollup", () => {
  it("computes weighted average", () => {
    expect(
      computeWeightedRollup([
        { workNodeId: "a", weight: 1, progressPercent: 100 },
        { workNodeId: "b", weight: 3, progressPercent: 0 },
      ]),
    ).toBe(25);
  });
});
