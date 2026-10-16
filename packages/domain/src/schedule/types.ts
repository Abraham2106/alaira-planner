/**
 * Scheduling domain types (pure data, no I/O).
 * Lag/lead: `lagMinutes` > 0 delays the successor; < 0 is lead (overlap).
 * Duration and lag for dependency resolution use the successor's calendar unless
 * a future revision adds per-edge calendars (documented in engine assumptions).
 */

export const DEPENDENCY_TYPES = ["FS", "SS", "FF", "SF"] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export const LAG_UNITS = ["minutes", "hours", "workdays"] as const;
export type LagUnit = (typeof LAG_UNITS)[number];

export type LocalTimeOfDay = {
  hour: number;
  minute: number;
};

/** ISO weekday 1 = Monday … 7 = Sunday. */
export type WorkCalendarDefinition = {
  timeZone: string;
  workingWeekdays: readonly number[];
  workDayStart: LocalTimeOfDay;
  /** Working minutes per standard day (e.g. 480 for 8h). */
  workMinutesPerDay: number;
  exceptions: readonly CalendarException[];
};

export type CalendarException =
  | { date: string; kind: "holiday" }
  | {
      date: string;
      kind: "working_override";
      workMinutesPerDay: number;
      workDayStart?: LocalTimeOfDay;
    };

export type ScheduleTaskDefinition = {
  id: string;
  /** Zero for milestones. */
  durationMinutes: number;
  calendar?: WorkCalendarDefinition;
};

export type ScheduleDependencyDefinition = {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lagMinutes: number;
};

export type CpmScheduleRequest = {
  /** Project start as UTC epoch milliseconds (need not be on a work boundary). */
  projectStartEpochMs: number;
  defaultCalendar: WorkCalendarDefinition;
  tasks: readonly ScheduleTaskDefinition[];
  dependencies: readonly ScheduleDependencyDefinition[];
};

export type TaskScheduleTimes = {
  taskId: string;
  earlyStartEpochMs: number;
  earlyFinishEpochMs: number;
  lateStartEpochMs: number;
  lateFinishEpochMs: number;
  totalFloatMinutes: number;
  freeFloatMinutes: number;
  isCritical: boolean;
};

export type CpmScheduleResult = {
  tasks: readonly TaskScheduleTimes[];
  criticalTaskIds: readonly string[];
  projectEarlyFinishEpochMs: number;
  projectLateFinishEpochMs: number;
  /** Explicit scheduling assumptions for REQ-023 / NFR-019. */
  assumptions: readonly string[];
};

export function lagToMinutes(amount: number, unit: LagUnit, workMinutesPerDay: number): number {
  switch (unit) {
    case "minutes":
      return amount;
    case "hours":
      return amount * 60;
    case "workdays":
      return amount * workMinutesPerDay;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}
