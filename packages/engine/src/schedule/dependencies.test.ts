import { describe, expect, it } from "vitest";
import { computeCpmSchedule } from "./cpm.js";
import { standardCalendar5x8, workMinutesBetween, zonedLocalToUtc } from "./calendar.js";

function continuousCalendar() {
  return {
    timeZone: "UTC",
    workingWeekdays: [1, 2, 3, 4, 5, 6, 7],
    workDayStart: { hour: 0, minute: 0 },
    workMinutesPerDay: 1440,
    exceptions: [] as const,
  };
}

describe("TC-SCH-03 dependency types FS/SS/FF/SF", () => {
  const cal = continuousCalendar();
  const projectStart = Date.UTC(2026, 0, 1, 0, 0);

  it("FS chains early start after predecessor finish", () => {
    const result = computeCpmSchedule({
      projectStartEpochMs: projectStart,
      defaultCalendar: cal,
      tasks: [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 50 },
      ],
      dependencies: [
        { id: "d1", predecessorId: "A", successorId: "B", type: "FS", lagMinutes: 0 },
      ],
    });
    const a = result.tasks.find((t) => t.taskId === "A")!;
    const b = result.tasks.find((t) => t.taskId === "B")!;
    expect(b.earlyStartEpochMs).toBe(a.earlyFinishEpochMs);
  });

  it("SS aligns starts", () => {
    const result = computeCpmSchedule({
      projectStartEpochMs: projectStart,
      defaultCalendar: cal,
      tasks: [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 50 },
      ],
      dependencies: [
        { id: "d1", predecessorId: "A", successorId: "B", type: "SS", lagMinutes: 10 },
      ],
    });
    const a = result.tasks.find((t) => t.taskId === "A")!;
    const b = result.tasks.find((t) => t.taskId === "B")!;
    expect(workMinutesBetween(a.earlyStartEpochMs, b.earlyStartEpochMs, cal)).toBe(10);
  });

  it("FF aligns finishes", () => {
    const result = computeCpmSchedule({
      projectStartEpochMs: projectStart,
      defaultCalendar: cal,
      tasks: [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 50 },
      ],
      dependencies: [
        { id: "d1", predecessorId: "A", successorId: "B", type: "FF", lagMinutes: 0 },
      ],
    });
    const a = result.tasks.find((t) => t.taskId === "A")!;
    const b = result.tasks.find((t) => t.taskId === "B")!;
    expect(b.earlyFinishEpochMs).toBe(a.earlyFinishEpochMs);
  });

  it("SF ties successor finish to predecessor start with lag", () => {
    const result = computeCpmSchedule({
      projectStartEpochMs: projectStart,
      defaultCalendar: cal,
      tasks: [
        { id: "A", durationMinutes: 80 },
        { id: "B", durationMinutes: 40 },
      ],
      dependencies: [
        { id: "d1", predecessorId: "A", successorId: "B", type: "SF", lagMinutes: 80 },
      ],
    });
    const a = result.tasks.find((t) => t.taskId === "A")!;
    const b = result.tasks.find((t) => t.taskId === "B")!;
    expect(workMinutesBetween(a.earlyStartEpochMs, b.earlyFinishEpochMs, cal)).toBe(80);
  });
});

describe("TC-SCH-04 lag and lead", () => {
  it("applies lag in working minutes on 5×8 calendar", () => {
    const cal = standardCalendar5x8("America/Costa_Rica");
    const start = zonedLocalToUtc(2026, 1, 5, 8, 0, cal.timeZone);
    const result = computeCpmSchedule({
      projectStartEpochMs: start,
      defaultCalendar: cal,
      tasks: [
        { id: "A", durationMinutes: 480 },
        { id: "B", durationMinutes: 480 },
      ],
      dependencies: [
        { id: "d1", predecessorId: "A", successorId: "B", type: "FS", lagMinutes: 240 },
      ],
    });
    const a = result.tasks.find((t) => t.taskId === "A")!;
    const b = result.tasks.find((t) => t.taskId === "B")!;
    expect(workMinutesBetween(a.earlyFinishEpochMs, b.earlyStartEpochMs, cal)).toBe(240);
  });

  it("lead (negative lag) allows overlap on continuous calendar", () => {
    const cal = continuousCalendar();
    const result = computeCpmSchedule({
      projectStartEpochMs: 0,
      defaultCalendar: cal,
      tasks: [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 100 },
      ],
      dependencies: [
        { id: "d1", predecessorId: "A", successorId: "B", type: "FS", lagMinutes: -30 },
      ],
    });
    const a = result.tasks.find((t) => t.taskId === "A")!;
    const b = result.tasks.find((t) => t.taskId === "B")!;
    expect(workMinutesBetween(b.earlyStartEpochMs, a.earlyFinishEpochMs, cal)).toBe(30);
  });
});
