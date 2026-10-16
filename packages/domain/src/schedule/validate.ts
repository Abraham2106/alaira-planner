import { ScheduleError } from "./errors.js";
import type {
  CpmScheduleRequest,
  ScheduleDependencyDefinition,
  ScheduleTaskDefinition,
} from "./types.js";

export function validateScheduleRequest(request: CpmScheduleRequest): void {
  if (!Number.isFinite(request.projectStartEpochMs)) {
    throw new ScheduleError("VALIDATION", "projectStartEpochMs must be finite");
  }
  const taskIds = new Set<string>();
  for (const task of request.tasks) {
    if (!task.id) {
      throw new ScheduleError("VALIDATION", "Task id is required");
    }
    if (taskIds.has(task.id)) {
      throw new ScheduleError("VALIDATION", `Duplicate task id: ${task.id}`);
    }
    taskIds.add(task.id);
    if (!Number.isFinite(task.durationMinutes) || task.durationMinutes < 0) {
      throw new ScheduleError("VALIDATION", `Invalid duration for task ${task.id}`);
    }
  }
  for (const dep of request.dependencies) {
    validateDependency(dep, taskIds);
  }
}

function validateDependency(
  dep: ScheduleDependencyDefinition,
  taskIds: Set<string>,
): void {
  if (dep.predecessorId === dep.successorId) {
    throw new ScheduleError("SELF_DEPENDENCY", "Dependency cannot link a task to itself", {
      dependencyId: dep.id,
    });
  }
  if (!taskIds.has(dep.predecessorId) || !taskIds.has(dep.successorId)) {
    throw new ScheduleError("UNKNOWN_TASK", "Dependency references unknown task", {
      dependencyId: dep.id,
    });
  }
}
