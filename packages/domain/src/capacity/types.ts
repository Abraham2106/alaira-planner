import type { WorkCalendarDefinition } from "../schedule/types.js";

/**
 * Work / duration / units triangle (REQ-083). Same semantics as classic resource scheduling:
 * `workMinutes` is effort; `durationMinutes` is elapsed working time on the assignment span;
 * `units` is the fraction of the person's capacity applied (1 = 100%).
 * Invariant when consistent: workMinutes ≈ durationMinutes × units.
 */
export const ASSIGNMENT_RECALC_MODES = ["fixed_work", "fixed_duration", "fixed_units"] as const;
export type AssignmentRecalcMode = (typeof ASSIGNMENT_RECALC_MODES)[number];

export type PersonResourceDefinition = {
  id: string;
  calendar: WorkCalendarDefinition;
  /** Maximum concurrent assignment units (default 1 = one full-time equivalent). */
  maxUnits?: number;
};

export type ResourceAssignmentDefinition = {
  id: string;
  personId: string;
  taskId: string;
  units: number;
  workMinutes: number;
  durationMinutes: number;
};

/** Scheduled civil interval for a task (typically from CPM early start/finish). */
export type TaskAssignmentWindow = {
  taskId: string;
  startEpochMs: number;
  finishEpochMs: number;
};

export type CapacityAnalysisRequest = {
  people: readonly PersonResourceDefinition[];
  assignments: readonly ResourceAssignmentDefinition[];
  taskWindows: readonly TaskAssignmentWindow[];
};

export type OverassignmentConflict = {
  personId: string;
  intervalStartEpochMs: number;
  intervalEndEpochMs: number;
  assignedUnits: number;
  maxUnits: number;
};

export type CapacityAnalysisResult = {
  conflicts: readonly OverassignmentConflict[];
  /** Assignments after work/duration/units consistency (unchanged if already consistent). */
  assignments: readonly ResourceAssignmentDefinition[];
  assumptions: readonly string[];
};

export type AssignmentTriangleField = "work" | "duration" | "units";

export type AssignmentTriangle = Pick<
  ResourceAssignmentDefinition,
  "workMinutes" | "durationMinutes" | "units"
>;
