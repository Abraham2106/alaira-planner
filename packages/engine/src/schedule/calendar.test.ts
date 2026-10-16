import { describe, expect, it } from "vitest";
import {
  addWorkMinutes,
  formatInstantWithOffset,
  standardCalendar5x8,
  zonedLocalToUtc,
} from "./calendar.js";

describe("TC-SCH-02 calendar 5×8, holiday, timezone", () => {
  const cal = standardCalendar5x8("America/Costa_Rica");

  it("produces reproducible ISO snapshots across holiday", () => {
    const holidayCal = {
      ...cal,
      exceptions: [{ date: "2026-01-01", kind: "holiday" as const }],
    };
    const start = zonedLocalToUtc(2025, 12, 31, 8, 0, holidayCal.timeZone);
    const end = addWorkMinutes(start, 960, holidayCal);
    expect(formatInstantWithOffset(start, holidayCal.timeZone)).toBe(
      "2025-12-31T08:00:00-06:00",
    );
    expect(formatInstantWithOffset(end, holidayCal.timeZone)).toBe("2026-01-02T16:00:00-06:00");
    expect(formatInstantWithOffset(addWorkMinutes(start, 960, holidayCal), holidayCal.timeZone)).toBe(
      "2026-01-02T16:00:00-06:00",
    );
  });

  it("skips weekends on a 5×8 calendar", () => {
    const start = zonedLocalToUtc(2026, 1, 9, 8, 0, cal.timeZone);
    const end = addWorkMinutes(start, 960, cal);
    expect(formatInstantWithOffset(end, cal.timeZone)).toBe("2026-01-12T16:00:00-06:00");
  });
});

describe("TC-SCH-02 DST (America/New_York)", () => {
  it("counts one workday as 480 minutes across spring-forward", () => {
    const cal = standardCalendar5x8("America/New_York");
    const start = zonedLocalToUtc(2026, 3, 6, 8, 0, cal.timeZone);
    expect(formatInstantWithOffset(addWorkMinutes(start, 480, cal), cal.timeZone)).toBe(
      "2026-03-06T16:00:00-05:00",
    );
    expect(formatInstantWithOffset(addWorkMinutes(start, 960, cal), cal.timeZone)).toBe(
      "2026-03-09T16:00:00-04:00",
    );
  });
});
