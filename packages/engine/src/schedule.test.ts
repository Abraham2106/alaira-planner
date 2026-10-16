import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { computeScheduleSnapshot } from "./index.js";

describe("computeScheduleSnapshot", () => {
  it("adds duration in UTC days deterministically", () => {
    const snap = computeScheduleSnapshot("2026-01-01T00:00:00.000Z", 5);
    expect(snap.plannedEnd).toBe("2026-01-06T00:00:00.000Z");
  });

  it("property: duration zero keeps same end date", () => {
    fc.assert(
      fc.property(fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }), (d) => {
        const iso = d.toISOString();
        const snap = computeScheduleSnapshot(iso, 0);
        expect(snap.plannedEnd.slice(0, 10)).toBe(iso.slice(0, 10));
      }),
    );
  });
});
