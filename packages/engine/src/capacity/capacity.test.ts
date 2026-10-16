import { describe, expect, it } from "vitest";
import { recalculateAssignmentTriangle } from "@alaira/domain/capacity";
import { standardCalendar5x8 } from "../schedule/calendar.js";
import { computeCapacityAnalysis } from "./compute.js";

function continuousCalendar() {
  return {
    timeZone: "UTC",
    workingWeekdays: [1, 2, 3, 4, 5, 6, 7],
    workDayStart: { hour: 0, minute: 0 },
    workMinutesPerDay: 1440,
    exceptions: [] as const,
  };
}

describe("TASK-0107 — TC-RES-02 / TC-RES-04", () => {
  it("TC-RES-02: señala sobreasignación cuando dos tareas solapan al 100%", () => {
    const cal = continuousCalendar();
    const hour = 3_600_000;
    const result = computeCapacityAnalysis({
      people: [{ id: "p1", calendar: cal }],
      assignments: [
        {
          id: "a1",
          personId: "p1",
          taskId: "t1",
          units: 1,
          workMinutes: 240,
          durationMinutes: 240,
        },
        {
          id: "a2",
          personId: "p1",
          taskId: "t2",
          units: 1,
          workMinutes: 240,
          durationMinutes: 240,
        },
      ],
      taskWindows: [
        { taskId: "t1", startEpochMs: 0, finishEpochMs: 4 * hour },
        { taskId: "t2", startEpochMs: 2 * hour, finishEpochMs: 6 * hour },
      ],
    });

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toMatchObject({
      personId: "p1",
      intervalStartEpochMs: 2 * hour,
      intervalEndEpochMs: 4 * hour,
      assignedUnits: 2,
      maxUnits: 1,
    });
  });

  it("TC-RES-04: cambiar unidades con trabajo fijo recalcula duración (calendario persona importado)", () => {
    const personCal = standardCalendar5x8("America/Costa_Rica");
    expect(personCal.workMinutesPerDay).toBe(480);

    const next = recalculateAssignmentTriangle(
      { workMinutes: 480, durationMinutes: 480, units: 1 },
      "fixed_work",
      "units",
    );
    expect(next.workMinutes).toBe(480);
    expect(next.units).toBe(1);
    expect(next.durationMinutes).toBe(480);

    const halfUnits = recalculateAssignmentTriangle(
      { workMinutes: 480, durationMinutes: 480, units: 0.5 },
      "fixed_work",
      "units",
    );
    expect(halfUnits.workMinutes).toBe(480);
    expect(halfUnits.units).toBe(0.5);
    expect(halfUnits.durationMinutes).toBe(960);
  });
});
