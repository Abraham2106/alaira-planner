import { describe, expect, it } from "vitest";
import { buildCapacityAnalysisRequest } from "./analysis.js";

describe("buildCapacityAnalysisRequest", () => {
  it("maps work nodes to task windows for engine", () => {
    const request = buildCapacityAnalysisRequest(
      [
        {
          id: "p1",
          projectId: "proj",
          displayName: "Ana",
          teamName: null,
          maxUnits: 1,
          calendar: {
            timeZone: "UTC",
            workingWeekdays: [1, 2, 3, 4, 5],
            workDayStart: { hour: 9, minute: 0 },
            workMinutesPerDay: 480,
            exceptions: [],
          },
        },
      ],
      [
        {
          id: "a1",
          projectId: "proj",
          personId: "p1",
          workNodeId: "w1",
          units: 1,
          workMinutes: 60,
          durationMinutes: 60,
          scheduledStartEpochMs: 0,
          scheduledFinishEpochMs: 1000,
        },
      ],
    );
    expect(request.taskWindows).toEqual([
      { taskId: "w1", startEpochMs: 0, finishEpochMs: 1000 },
    ]);
    expect(request.assignments[0]?.taskId).toBe("w1");
  });
});
