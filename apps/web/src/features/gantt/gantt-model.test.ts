import { describe, expect, it } from "vitest";
import { barStyle, computeTimelineBounds, mapVarianceToRows } from "./gantt-model.js";

describe("gantt-model", () => {
  it("maps variance API rows with baseline and forecast deltas", () => {
    const rows = mapVarianceToRows({
      projectId: "prj_018f00000000700080000000000001",
      baselineVersion: 1,
      forecastVersion: 2,
      tasks: [
        {
          workNodeId: "wkn_018f00000000700080000000000001",
          baseline: {
            workNodeId: "wkn_018f00000000700080000000000001",
            earlyStartEpochMs: 1_000_000,
            earlyFinishEpochMs: 2_000_000,
            plannedCostMinor: 100,
          },
          forecast: {
            workNodeId: "wkn_018f00000000700080000000000001",
            earlyStartEpochMs: 1_000_000,
            earlyFinishEpochMs: 2_600_000,
          },
          actual: null,
          variance: {
            workNodeId: "wkn_018f00000000700080000000000001",
            forecastFinishVsBaselineMinutes: 120,
            actualFinishVsBaselineMinutes: null,
            actualCostVsBaselineMinor: null,
          },
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.forecastFinishVsBaselineMinutes).toBe(120);
  });

  it("computes timeline bounds with minimum span", () => {
    const rows = mapVarianceToRows({
      projectId: "prj_018f00000000700080000000000001",
      baselineVersion: 1,
      forecastVersion: 1,
      tasks: [
        {
          workNodeId: "wkn_018f00000000700080000000000001",
          baseline: {
            workNodeId: "wkn_018f00000000700080000000000001",
            earlyStartEpochMs: 5_000,
            earlyFinishEpochMs: 5_001,
            plannedCostMinor: null,
          },
          forecast: null,
          actual: null,
          variance: {
            workNodeId: "wkn_018f00000000700080000000000001",
            forecastFinishVsBaselineMinutes: null,
            actualFinishVsBaselineMinutes: null,
            actualCostVsBaselineMinor: null,
          },
        },
      ],
    });
    const bounds = computeTimelineBounds(rows);
    expect(bounds).not.toBeNull();
    expect(bounds!.spanMs).toBeGreaterThanOrEqual(60 * 60 * 1000);
    const style = barStyle(5_000, 5_001, bounds!);
    expect(style?.width).toBeTruthy();
  });
});
