import { describe, expect, it } from "vitest";
import { discoverFeatures } from "./discover-features.js";

describe("criterion 7: web feature autodiscovery", () => {
  it("loads features from src/features/*/Feature.tsx without registry edits", () => {
    expect(discoverFeatures().some((f) => f.id === "poc")).toBe(true);
  });
});
