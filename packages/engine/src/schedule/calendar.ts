import type { CalendarException, LocalTimeOfDay, WorkCalendarDefinition } from "@alaira/domain/schedule";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = dtfCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    });
    dtfCache.set(timeZone, fmt);
  }
  return fmt;
}

const weekdayMap: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export function getZonedParts(epochMs: number, timeZone: string): ZonedParts {
  const parts = getFormatter(timeZone).formatToParts(new Date(epochMs));
  const pick = (type: Intl.DateTimeFormatPartTypes): number => {
    const p = parts.find((x) => x.type === type);
    return p ? Number(p.value) : 0;
  };
  const weekdayStr = parts.find((x) => x.type === "weekday")?.value ?? "Mon";
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    weekday: weekdayMap[weekdayStr] ?? 1,
  };
}

function dateKey(parts: Pick<ZonedParts, "year" | "month" | "day">): string {
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  return `${parts.year}-${m}-${d}`;
}

function exceptionForDate(
  cal: WorkCalendarDefinition,
  date: string,
): CalendarException | undefined {
  return cal.exceptions.find((e) => e.date === date);
}

function dayConfig(
  cal: WorkCalendarDefinition,
  parts: ZonedParts,
): { workMinutesPerDay: number; workDayStart: LocalTimeOfDay; isWorking: boolean } {
  const key = dateKey(parts);
  const ex = exceptionForDate(cal, key);
  if (ex?.kind === "holiday") {
    return { workMinutesPerDay: 0, workDayStart: cal.workDayStart, isWorking: false };
  }
  if (ex?.kind === "working_override") {
    return {
      workMinutesPerDay: ex.workMinutesPerDay,
      workDayStart: ex.workDayStart ?? cal.workDayStart,
      isWorking: ex.workMinutesPerDay > 0,
    };
  }
  const isWeekday = cal.workingWeekdays.includes(parts.weekday);
  return {
    workMinutesPerDay: isWeekday ? cal.workMinutesPerDay : 0,
    workDayStart: cal.workDayStart,
    isWorking: isWeekday,
  };
}

/** Convert local civil time in `timeZone` to UTC epoch ms (handles DST). */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  for (let i = 0; i < 5; i++) {
    const z = getZonedParts(utc, timeZone);
    if (
      z.year === year &&
      z.month === month &&
      z.day === day &&
      z.hour === hour &&
      z.minute === minute
    ) {
      return utc;
    }
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const actual = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, 0, 0);
    utc += desired - actual;
  }
  return utc;
}

function startOfWorkDayUtc(parts: ZonedParts, cal: WorkCalendarDefinition): number | null {
  const cfg = dayConfig(cal, parts);
  if (!cfg.isWorking) {
    return null;
  }
  const { workDayStart } = cfg;
  return zonedLocalToUtc(parts.year, parts.month, parts.day, workDayStart.hour, workDayStart.minute, cal.timeZone);
}

function endOfWorkDayUtc(parts: ZonedParts, cal: WorkCalendarDefinition): number | null {
  const cfg = dayConfig(cal, parts);
  if (!cfg.isWorking) {
    return null;
  }
  const startMin = cfg.workDayStart.hour * 60 + cfg.workDayStart.minute;
  const endMin = startMin + cfg.workMinutesPerDay;
  const endHour = Math.floor(endMin / 60);
  const endMinute = endMin % 60;
  return zonedLocalToUtc(parts.year, parts.month, parts.day, endHour, endMinute, cal.timeZone);
}

function addCalendarDaysInZone(parts: ZonedParts, days: number, timeZone: string): ZonedParts {
  const noon = zonedLocalToUtc(parts.year, parts.month, parts.day, 12, 0, timeZone);
  const next = noon + days * 86_400_000;
  return getZonedParts(next, timeZone);
}

/** Align forward to the next instant that is inside working time. */
export function alignToWorkingTime(epochMs: number, cal: WorkCalendarDefinition): number {
  let cursor = epochMs;
  for (let guard = 0; guard < 366 * 5; guard++) {
    const parts = getZonedParts(cursor, cal.timeZone);
    const cfg = dayConfig(cal, parts);
    if (!cfg.isWorking) {
      const nextDay = addCalendarDaysInZone(parts, 1, cal.timeZone);
      cursor = zonedLocalToUtc(
        nextDay.year,
        nextDay.month,
        nextDay.day,
        cal.workDayStart.hour,
        cal.workDayStart.minute,
        cal.timeZone,
      );
      continue;
    }
    const dayStart = startOfWorkDayUtc(parts, cal)!;
    const dayEnd = endOfWorkDayUtc(parts, cal)!;
    if (cursor < dayStart) {
      return dayStart;
    }
    if (cursor >= dayEnd) {
      const nextDay = addCalendarDaysInZone(parts, 1, cal.timeZone);
      cursor = zonedLocalToUtc(
        nextDay.year,
        nextDay.month,
        nextDay.day,
        cal.workDayStart.hour,
        cal.workDayStart.minute,
        cal.timeZone,
      );
      continue;
    }
    return cursor;
  }
  throw new Error("Could not align to working time within search horizon");
}

export function addWorkMinutes(epochMs: number, minutes: number, cal: WorkCalendarDefinition): number {
  if (minutes === 0) {
    return alignToWorkingTime(epochMs, cal);
  }
  if (minutes < 0) {
    return subtractWorkMinutes(epochMs, -minutes, cal);
  }
  let cursor = alignToWorkingTime(epochMs, cal);
  let remaining = minutes;
  for (let guard = 0; guard < 500_000 && remaining > 0; guard++) {
    const parts = getZonedParts(cursor, cal.timeZone);
    const dayEnd = endOfWorkDayUtc(parts, cal);
    if (dayEnd === null) {
      cursor = alignToWorkingTime(cursor + 86_400_000, cal);
      continue;
    }
    const available = Math.max(0, Math.floor((dayEnd - cursor) / 60_000));
    if (available === 0) {
      cursor = alignToWorkingTime(dayEnd + 1, cal);
      continue;
    }
    const consume = Math.min(remaining, available);
    cursor += consume * 60_000;
    remaining -= consume;
    if (remaining > 0) {
      cursor = alignToWorkingTime(dayEnd + 1, cal);
    }
  }
  if (remaining > 0) {
    throw new Error("addWorkMinutes exceeded iteration guard");
  }
  return cursor;
}

export function subtractWorkMinutes(
  epochMs: number,
  minutes: number,
  cal: WorkCalendarDefinition,
): number {
  if (minutes === 0) {
    return alignToWorkingTime(epochMs, cal);
  }
  if (minutes < 0) {
    return addWorkMinutes(epochMs, -minutes, cal);
  }
  let cursor = epochMs;
  let remaining = minutes;
  let lastCursor = Number.NaN;
  for (let guard = 0; guard < 500_000 && remaining > 0; guard++) {
    if (cursor === lastCursor) {
      throw new Error("subtractWorkMinutes made no progress");
    }
    lastCursor = cursor;
    const parts = getZonedParts(cursor, cal.timeZone);
    const dayStart = startOfWorkDayUtc(parts, cal);
    const dayEnd = endOfWorkDayUtc(parts, cal);
    if (dayStart === null || dayEnd === null) {
      const prevDay = addCalendarDaysInZone(parts, -1, cal.timeZone);
      const prevEnd = endOfWorkDayUtc(prevDay, cal);
      if (prevEnd === null) {
        cursor -= 86_400_000;
        continue;
      }
      cursor = prevEnd - 60_000;
      continue;
    }
    if (cursor <= dayStart) {
      const prevDay = addCalendarDaysInZone(parts, -1, cal.timeZone);
      const prevStart = startOfWorkDayUtc(prevDay, cal);
      const prevEnd = endOfWorkDayUtc(prevDay, cal);
      if (prevEnd !== null && prevStart !== null && prevEnd > prevStart) {
        cursor = prevEnd - 60_000;
      } else {
        cursor = dayStart - 86_400_000;
      }
      continue;
    }
    const effective = Math.min(cursor, dayEnd);
    const available = Math.max(0, Math.floor((effective - dayStart) / 60_000));
    if (available === 0) {
      const prevDay = addCalendarDaysInZone(parts, -1, cal.timeZone);
      cursor = endOfWorkDayUtc(prevDay, cal) ?? dayStart - 1;
      continue;
    }
    const consume = Math.min(remaining, available);
    cursor -= consume * 60_000;
    remaining -= consume;
    if (remaining > 0) {
      const prevDay = addCalendarDaysInZone(getZonedParts(cursor, cal.timeZone), -1, cal.timeZone);
      const prevEnd = endOfWorkDayUtc(prevDay, cal);
      cursor = prevEnd !== null ? prevEnd - 60_000 : dayStart - 86_400_000;
    }
  }
  if (remaining > 0) {
    throw new Error("subtractWorkMinutes exceeded iteration guard");
  }
  return alignToWorkingTime(cursor, cal);
}

export function workMinutesBetween(
  startMs: number,
  endMs: number,
  cal: WorkCalendarDefinition,
): number {
  if (endMs <= startMs) {
    return 0;
  }
  let total = 0;
  let cursor = alignToWorkingTime(startMs, cal);
  const end = endMs;
  for (let guard = 0; guard < 500_000 && cursor < end; guard++) {
    const parts = getZonedParts(cursor, cal.timeZone);
    const dayEnd = endOfWorkDayUtc(parts, cal);
    if (dayEnd === null) {
      cursor = alignToWorkingTime(cursor + 86_400_000, cal);
      continue;
    }
    const sliceEnd = Math.min(end, dayEnd);
    if (cursor >= sliceEnd) {
      cursor = alignToWorkingTime(dayEnd + 1, cal);
      continue;
    }
    total += Math.floor((sliceEnd - cursor) / 60_000);
    cursor = alignToWorkingTime(dayEnd + 1, cal);
  }
  return total;
}

/** ISO-8601 with numeric offset for reproducible snapshots (REQ-020). */
export function formatInstantWithOffset(epochMs: number, timeZone: string): string {
  const parts = getZonedParts(epochMs, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMin = Math.round(
    (Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - epochMs) /
      60_000,
  );
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:00${sign}${oh}:${om}`;
}

export function standardCalendar5x8(timeZone: string): WorkCalendarDefinition {
  return {
    timeZone,
    workingWeekdays: [1, 2, 3, 4, 5],
    workDayStart: { hour: 8, minute: 0 },
    workMinutesPerDay: 480,
    exceptions: [],
  };
}
