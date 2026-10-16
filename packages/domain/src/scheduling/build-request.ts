import type {
  CpmScheduleRequest,
  ScheduleDependencyDefinition,
  ScheduleTaskDefinition,
  WorkCalendarDefinition,
} from "../schedule/types.js";

export type PersistedScheduleConfig = {
  projectStartEpochMs: number;
  defaultCalendar: WorkCalendarDefinition;
};

export type PersistedScheduleTask = {
  workNodeId: string;
  durationMinutes: number;
  calendarOverride: WorkCalendarDefinition | null;
};

export type PersistedScheduleDependency = {
  id: string;
  predecessorWorkNodeId: string;
  successorWorkNodeId: string;
  type: ScheduleDependencyDefinition["type"];
  lagMinutes: number;
};

export function buildCpmScheduleRequest(
  config: PersistedScheduleConfig,
  tasks: readonly PersistedScheduleTask[],
  dependencies: readonly PersistedScheduleDependency[],
): CpmScheduleRequest {
  const scheduleTasks: ScheduleTaskDefinition[] = tasks.map((t) => ({
    id: t.workNodeId,
    durationMinutes: t.durationMinutes,
    calendar: t.calendarOverride ?? undefined,
  }));
  const scheduleDeps: ScheduleDependencyDefinition[] = dependencies.map((d) => ({
    id: d.id,
    predecessorId: d.predecessorWorkNodeId,
    successorId: d.successorWorkNodeId,
    type: d.type,
    lagMinutes: d.lagMinutes,
  }));
  return {
    projectStartEpochMs: config.projectStartEpochMs,
    defaultCalendar: config.defaultCalendar,
    tasks: scheduleTasks,
    dependencies: scheduleDeps,
  };
}
