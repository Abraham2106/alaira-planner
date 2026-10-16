import { describe, expect, it } from "vitest";
import { formatVarianceMinutes } from "./format-schedule.js";

describe("formatVarianceMinutes", () => {
  it("shows on-schedule and signed deltas", () => {
    expect(formatVarianceMinutes(null)).toBe("—");
    expect(formatVarianceMinutes(0)).toMatch(/0 min/);
    expect(formatVarianceMinutes(90)).toMatch(/\+/);
    expect(formatVarianceMinutes(-45)).toMatch(/min/);
  });
});
