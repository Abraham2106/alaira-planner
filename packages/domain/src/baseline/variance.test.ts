import { describe, expect, it } from "vitest";
import { computeProjectScheduleVariances, computeTaskScheduleVariance } from "./variance.js";

describe("baseline variance (TC-BASE-04 partial)", () => {
  it("computes finish and cost deltas vs baseline", () => {
    const variance = computeTaskScheduleVariance({
      workNodeId: "wkn_test",
      baselineEarlyFinishEpochMs: 1_000_000,
      forecastEarlyFinishEpochMs: 1_120_000,
      actualFinishEpochMs: 1_240_000,
      baselinePlannedCostMinor: 10_000,
      actualCostMinor: 12_500,
    });
    expect(variance.forecastFinishVsBaselineMinutes).toBe(2);
    expect(variance.actualFinishVsBaselineMinutes).toBe(4);
    expect(variance.actualCostVsBaselineMinor).toBe(2_500);
  });

  it("returns null cost variance when baseline cost missing", () => {
    const [row] = computeProjectScheduleVariances([
      {
        workNodeId: "wkn_a",
        baselineEarlyFinishEpochMs: 1_000_000,
        forecastEarlyFinishEpochMs: 1_120_000,
        actualFinishEpochMs: null,
        baselinePlannedCostMinor: null,
        actualCostMinor: 50,
      },
    ]);
    expect(row?.actualCostVsBaselineMinor).toBeNull();
    expect(row?.forecastFinishVsBaselineMinutes).toBe(2);
  });
});
