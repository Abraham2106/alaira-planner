import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { ScheduleError } from "@alaira/domain/schedule";
import { computeCpmSchedule } from "./cpm.js";
import {
  addWorkMinutes,
  formatInstantWithOffset,
  standardCalendar5x8,
  workMinutesBetween,
  zonedLocalToUtc,
} from "./calendar.js";
import { oracleCpm } from "./oracle.js";

function continuousCalendar() {
  return {
    timeZone: "UTC",
    workingWeekdays: [1, 2, 3, 4, 5, 6, 7],
    workDayStart: { hour: 0, minute: 0 },
    workMinutesPerDay: 1440,
    exceptions: [] as const,
  };
}

function assertMatchesOracle(
  cal: ReturnType<typeof continuousCalendar>,
  tasks: { id: string; durationMinutes: number }[],
  dependencies: Parameters<typeof oracleCpm>[1],
  projectStart = 0,
): void {
  const engine = computeCpmSchedule({
    projectStartEpochMs: projectStart,
    defaultCalendar: cal,
    tasks,
    dependencies,
  });
  const oracle = oracleCpm(
    tasks.map((t) => ({ id: t.id, duration: t.durationMinutes })),
    dependencies,
    0,
  );
  for (const t of tasks) {
    const row = engine.tasks.find((x) => x.taskId === t.id)!;
    expect(workMinutesBetween(projectStart, row.earlyStartEpochMs, cal)).toBe(oracle.es.get(t.id));
    expect(workMinutesBetween(projectStart, row.earlyFinishEpochMs, cal)).toBe(oracle.ef.get(t.id));
  }
}

describe("TASK-0102 — TC-SCH-02..05", () => {
  const linear = continuousCalendar();

  it("oráculo: FS/SS/FF/SF, feriado 5×8 y rechazo de ciclo", () => {
    const calCr = standardCalendar5x8("America/Costa_Rica");
    const holidayCal = {
      ...calCr,
      exceptions: [{ date: "2026-01-01", kind: "holiday" as const }],
    };
    const start = zonedLocalToUtc(2025, 12, 31, 8, 0, holidayCal.timeZone);
    const endIso = formatInstantWithOffset(addWorkMinutes(start, 960, holidayCal), holidayCal.timeZone);
    expect(formatInstantWithOffset(start, holidayCal.timeZone)).toBe("2025-12-31T08:00:00-06:00");
    expect(endIso).toBe("2026-01-02T16:00:00-06:00");
    expect(formatInstantWithOffset(addWorkMinutes(start, 960, holidayCal), holidayCal.timeZone)).toBe(
      endIso,
    );

    expect(() =>
      computeCpmSchedule({
        projectStartEpochMs: 0,
        defaultCalendar: linear,
        tasks: [
          { id: "A", durationMinutes: 1 },
          { id: "B", durationMinutes: 1 },
        ],
        dependencies: [
          { id: "d1", predecessorId: "A", successorId: "B", type: "FS", lagMinutes: 0 },
          { id: "d2", predecessorId: "B", successorId: "A", type: "FS", lagMinutes: 0 },
        ],
      }),
    ).toThrow(ScheduleError);

    assertMatchesOracle(
      linear,
      [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 50 },
      ],
      [{ id: "d1", predecessorId: "A", successorId: "B", type: "FS", lagMinutes: 5 }],
    );
    assertMatchesOracle(
      linear,
      [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 50 },
      ],
      [{ id: "d1", predecessorId: "A", successorId: "B", type: "SS", lagMinutes: 10 }],
    );
    assertMatchesOracle(
      linear,
      [
        { id: "A", durationMinutes: 100 },
        { id: "B", durationMinutes: 50 },
      ],
      [{ id: "d1", predecessorId: "A", successorId: "B", type: "FF", lagMinutes: 0 }],
    );
    assertMatchesOracle(
      linear,
      [
        { id: "A", durationMinutes: 80 },
        { id: "B", durationMinutes: 40 },
      ],
      [{ id: "d1", predecessorId: "A", successorId: "B", type: "SF", lagMinutes: 80 }],
    );
  });

  it("propiedad: cadena FS coincide con oráculo (fast-check)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 5, max: 80 }), { minLength: 2, maxLength: 5 }),
        fc.array(fc.integer({ min: 0, max: 8 }), { minLength: 1, maxLength: 4 }),
        (durationsRaw, lagsRaw) => {
          const ids = durationsRaw.map((_, i) => `T${i}`);
          const tasks = ids.map((id, i) => ({
            id,
            durationMinutes: durationsRaw[i]!,
          }));
          const dependencies = ids.slice(1).map((succId, i) => ({
            id: `d-${i}`,
            predecessorId: ids[i]!,
            successorId: succId,
            type: "FS" as const,
            lagMinutes: lagsRaw[i % lagsRaw.length] ?? 0,
          }));
          assertMatchesOracle(linear, tasks, dependencies);
        },
      ),
      { numRuns: 25 },
    );
  });
});
