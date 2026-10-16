import type { CapacityAnalysisRequest } from "../capacity/types.js";
import type { ProjectPersonRecord, WorkNodeAssignmentRecord } from "./types.js";

/**
 * Maps persisted project people and assignments into the pure capacity engine request.
 * Task windows come from assignment schedule fields until CPM persistence (0113) owns them.
 */
export function buildCapacityAnalysisRequest(
  people: readonly ProjectPersonRecord[],
  assignments: readonly WorkNodeAssignmentRecord[],
): CapacityAnalysisRequest {
  const taskWindows = assignments.map((a) => ({
    taskId: a.workNodeId,
    startEpochMs: a.scheduledStartEpochMs,
    finishEpochMs: a.scheduledFinishEpochMs,
  }));

  const uniqueWindows = new Map(taskWindows.map((w) => [w.taskId, w]));

  return {
    people: people.map((p) => ({
      id: p.id,
      calendar: p.calendar,
      maxUnits: p.maxUnits,
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      personId: a.personId,
      taskId: a.workNodeId,
      units: a.units,
      workMinutes: a.workMinutes,
      durationMinutes: a.durationMinutes,
    })),
    taskWindows: [...uniqueWindows.values()],
  };
}
