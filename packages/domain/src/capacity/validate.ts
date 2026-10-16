import { CapacityError } from "./errors.js";
import type { CapacityAnalysisRequest } from "./types.js";

export function validateCapacityRequest(request: CapacityAnalysisRequest): void {
  const personIds = new Set<string>();
  for (const person of request.people) {
    if (!person.id) {
      throw new CapacityError("VALIDATION", "Person id is required");
    }
    if (personIds.has(person.id)) {
      throw new CapacityError("VALIDATION", `Duplicate person id: ${person.id}`);
    }
    personIds.add(person.id);
    const max = person.maxUnits ?? 1;
    if (!Number.isFinite(max) || max <= 0) {
      throw new CapacityError("VALIDATION", `Invalid maxUnits for person ${person.id}`);
    }
  }

  const taskIds = new Set(request.taskWindows.map((w) => w.taskId));
  for (const window of request.taskWindows) {
    if (!window.taskId) {
      throw new CapacityError("VALIDATION", "Task window taskId is required");
    }
    if (!Number.isFinite(window.startEpochMs) || !Number.isFinite(window.finishEpochMs)) {
      throw new CapacityError("VALIDATION", `Invalid task window for ${window.taskId}`);
    }
    if (window.finishEpochMs < window.startEpochMs) {
      throw new CapacityError("VALIDATION", `Task finish before start: ${window.taskId}`);
    }
  }

  const assignmentIds = new Set<string>();
  for (const assignment of request.assignments) {
    if (!assignment.id) {
      throw new CapacityError("VALIDATION", "Assignment id is required");
    }
    if (assignmentIds.has(assignment.id)) {
      throw new CapacityError("VALIDATION", `Duplicate assignment id: ${assignment.id}`);
    }
    assignmentIds.add(assignment.id);
    if (!personIds.has(assignment.personId)) {
      throw new CapacityError("UNKNOWN_PERSON", "Assignment references unknown person", {
        assignmentId: assignment.id,
        personId: assignment.personId,
      });
    }
    if (!taskIds.has(assignment.taskId)) {
      throw new CapacityError("UNKNOWN_TASK", "Assignment references task without schedule window", {
        assignmentId: assignment.id,
        taskId: assignment.taskId,
      });
    }
    if (assignment.units < 0 || assignment.workMinutes < 0 || assignment.durationMinutes < 0) {
      throw new CapacityError("VALIDATION", `Invalid assignment metrics: ${assignment.id}`);
    }
  }
}
