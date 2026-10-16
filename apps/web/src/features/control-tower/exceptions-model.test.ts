import { describe, expect, it } from "vitest";
import { mapVarianceToRows } from "../gantt/gantt-model.js";
import { detectScheduleExceptions } from "./exceptions-model.js";

describe("detectScheduleExceptions", () => {
  it("flags forecast slip above threshold", () => {
    const rows = mapVarianceToRows({
      projectId: "prj_018f00000000700080000000000001",
      baselineVersion: 1,
      forecastVersion: 1,
      tasks: [
        {
          workNodeId: "wkn_ok",
          baseline: null,
          forecast: null,
          actual: null,
          variance: {
            workNodeId: "wkn_ok",
            forecastFinishVsBaselineMinutes: 10,
            actualFinishVsBaselineMinutes: null,
            actualCostVsBaselineMinor: null,
          },
        },
        {
          workNodeId: "wkn_bad",
          baseline: null,
          forecast: null,
          actual: null,
          variance: {
            workNodeId: "wkn_bad",
            forecastFinishVsBaselineMinutes: 120,
            actualFinishVsBaselineMinutes: null,
            actualCostVsBaselineMinor: null,
          },
        },
      ],
    });
    const exceptions = detectScheduleExceptions(rows);
    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]?.workNodeId).toBe("wkn_bad");
    expect(exceptions[0]?.kind).toBe("forecast_slip");
  });
});
