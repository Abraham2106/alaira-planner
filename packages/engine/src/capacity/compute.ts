import type { CapacityAnalysisRequest, CapacityAnalysisResult } from "@alaira/domain/capacity";
import { validateCapacityRequest } from "@alaira/domain/capacity";
import { detectOverassignments } from "./overassignment.js";

const CAPACITY_ASSUMPTIONS: readonly string[] = [
  "Overassignment: sum of assignment units on overlapping task windows exceeds person maxUnits (default 1).",
  "Task load uses scheduled [startEpochMs, finishEpochMs) from CPM or manual dates; no leveling (M5).",
  "Work, duration and units follow recalculateAssignmentTriangle in domain (REQ-083); analysis does not mutate inputs.",
  "Person calendars are carried on PersonResourceDefinition for future daily load; interval check is calendar-agnostic in M1.",
];

/**
 * Pure capacity analysis: overassignment detection (REQ-018) on scheduled task windows.
 */
export function computeCapacityAnalysis(request: CapacityAnalysisRequest): CapacityAnalysisResult {
  validateCapacityRequest(request);
  const conflicts = detectOverassignments(request.people, request.assignments, request.taskWindows);
  return {
    conflicts,
    assignments: request.assignments.map((a) => ({ ...a })),
    assumptions: CAPACITY_ASSUMPTIONS,
  };
}
