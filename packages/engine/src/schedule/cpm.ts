import type {
  CpmScheduleRequest,
  CpmScheduleResult,
  DependencyType,
  ScheduleDependencyDefinition,
  ScheduleTaskDefinition,
  TaskScheduleTimes,
  WorkCalendarDefinition,
} from "@alaira/domain/schedule";
import { ScheduleError, validateScheduleRequest } from "@alaira/domain/schedule";
import { addWorkMinutes, alignToWorkingTime, subtractWorkMinutes, workMinutesBetween } from "./calendar.js";
import { buildTaskGraph, topologicalSort } from "./graph.js";

const CPM_ASSUMPTIONS: readonly string[] = [
  "CPM uses as-late-as-possible backward pass anchored at project early finish.",
  "Each task uses its own calendar when set, otherwise the project default calendar.",
  "Dependency lag is expressed in working minutes on the successor task calendar.",
  "Milestone tasks have zero duration; early finish equals early start.",
  "Total float is working minutes between early and late start.",
  "Free float is the minimum working slack to any immediate successor constraint.",
];

function calendarForTask(task: ScheduleTaskDefinition, defaultCal: WorkCalendarDefinition): WorkCalendarDefinition {
  return task.calendar ?? defaultCal;
}

function applyLag(instant: number, lagMinutes: number, cal: WorkCalendarDefinition): number {
  if (lagMinutes === 0) {
    return instant;
  }
  if (lagMinutes > 0) {
    return addWorkMinutes(instant, lagMinutes, cal);
  }
  return subtractWorkMinutes(instant, -lagMinutes, cal);
}

function constraintEarlyStart(
  dep: ScheduleDependencyDefinition,
  predES: number,
  predEF: number,
  succDuration: number,
  succCal: WorkCalendarDefinition,
): number {
  const lag = dep.lagMinutes;
  switch (dep.type as DependencyType) {
    case "FS":
      return applyLag(predEF, lag, succCal);
    case "SS":
      return applyLag(predES, lag, succCal);
    case "FF": {
      const efBound = applyLag(predEF, lag, succCal);
      return subtractWorkMinutes(efBound, succDuration, succCal);
    }
    case "SF": {
      const efBound = applyLag(predES, lag, succCal);
      return subtractWorkMinutes(efBound, succDuration, succCal);
    }
    default: {
      const _exhaustive: never = dep.type;
      return _exhaustive;
    }
  }
}

function constraintLateFinish(
  dep: ScheduleDependencyDefinition,
  succLS: number,
  succLF: number,
  predDuration: number,
  predCal: WorkCalendarDefinition,
  succCal: WorkCalendarDefinition,
): number {
  const lag = dep.lagMinutes;
  switch (dep.type as DependencyType) {
    case "FS":
      return applyLag(succLS, -lag, predCal);
    case "SS": {
      const lsBound = applyLag(succLS, -lag, predCal);
      return addWorkMinutes(lsBound, predDuration, predCal);
    }
    case "FF":
      return applyLag(succLF, -lag, predCal);
    case "SF": {
      const lsBound = applyLag(succLF, -lag, predCal);
      return addWorkMinutes(lsBound, predDuration, predCal);
    }
    default: {
      const _exhaustive: never = dep.type;
      return _exhaustive;
    }
  }
}

export function computeCpmSchedule(request: CpmScheduleRequest): CpmScheduleResult {
  validateScheduleRequest(request);
  const taskById = new Map(request.tasks.map((t) => [t.id, t]));
  const graph = buildTaskGraph(
    request.tasks.map((t) => t.id),
    request.dependencies,
  );
  const order = topologicalSort(graph);

  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  for (const taskId of order) {
    const task = taskById.get(taskId)!;
    const cal = calendarForTask(task, request.defaultCalendar);
    let es = alignToWorkingTime(request.projectStartEpochMs, cal);
    for (const dep of request.dependencies) {
      if (dep.successorId !== taskId) {
        continue;
      }
      const predES = earlyStart.get(dep.predecessorId);
      const predEF = earlyFinish.get(dep.predecessorId);
      if (predES === undefined || predEF === undefined) {
        throw new ScheduleError("VALIDATION", "Predecessor schedule missing during forward pass");
      }
      const bound = constraintEarlyStart(dep, predES, predEF, task.durationMinutes, cal);
      if (bound > es) {
        es = alignToWorkingTime(bound, cal);
      }
    }
    earlyStart.set(taskId, es);
    earlyFinish.set(taskId, addWorkMinutes(es, task.durationMinutes, cal));
  }

  const projectEarlyFinish = Math.max(...[...earlyFinish.values()]);

  const lateFinish = new Map<string, number>();
  const lateStart = new Map<string, number>();
  for (const taskId of [...order].reverse()) {
    const task = taskById.get(taskId)!;
    const cal = calendarForTask(task, request.defaultCalendar);
    let lf = projectEarlyFinish;
    const succs = graph.successors.get(taskId) ?? [];
    if (succs.length === 0) {
      lf = alignToWorkingTime(projectEarlyFinish, cal);
    } else {
      let minLf = Number.POSITIVE_INFINITY;
      for (const dep of request.dependencies) {
        if (dep.predecessorId !== taskId) {
          continue;
        }
        const succLS = lateStart.get(dep.successorId);
        const succLF = lateFinish.get(dep.successorId);
        if (succLS === undefined || succLF === undefined) {
          continue;
        }
        const succTask = taskById.get(dep.successorId)!;
        const succCal = calendarForTask(succTask, request.defaultCalendar);
        const bound = constraintLateFinish(dep, succLS, succLF, task.durationMinutes, cal, succCal);
        minLf = Math.min(minLf, bound);
      }
      lf = Number.isFinite(minLf)
        ? alignToWorkingTime(minLf, cal)
        : alignToWorkingTime(projectEarlyFinish, cal);
    }
    lateFinish.set(taskId, lf);
    lateStart.set(taskId, subtractWorkMinutes(lf, task.durationMinutes, cal));
  }

  const tasks: TaskScheduleTimes[] = [];
  const critical: string[] = [];

  for (const task of request.tasks) {
    const cal = calendarForTask(task, request.defaultCalendar);
    const es = earlyStart.get(task.id)!;
    const ef = earlyFinish.get(task.id)!;
    const ls = lateStart.get(task.id)!;
    const lf = lateFinish.get(task.id)!;
    const totalFloat = workMinutesBetween(es, ls, cal);
    let freeFloat = totalFloat;
    const succDeps = request.dependencies.filter((d) => d.predecessorId === task.id);
    if (succDeps.length > 0) {
      freeFloat = Number.POSITIVE_INFINITY;
      for (const dep of succDeps) {
        const succTask = taskById.get(dep.successorId)!;
        const succCal = calendarForTask(succTask, request.defaultCalendar);
        const succES = earlyStart.get(dep.successorId)!;
        let bound = constraintEarlyStart(
          dep,
          es,
          ef,
          succTask.durationMinutes,
          succCal,
        );
        bound = alignToWorkingTime(bound, succCal);
        const slack = workMinutesBetween(ef, bound, cal);
        freeFloat = Math.min(freeFloat, slack);
      }
      if (!Number.isFinite(freeFloat)) {
        freeFloat = totalFloat;
      }
    }
    const isCritical = totalFloat === 0;
    if (isCritical) {
      critical.push(task.id);
    }
    tasks.push({
      taskId: task.id,
      earlyStartEpochMs: es,
      earlyFinishEpochMs: ef,
      lateStartEpochMs: ls,
      lateFinishEpochMs: lf,
      totalFloatMinutes: totalFloat,
      freeFloatMinutes: freeFloat,
      isCritical,
    });
  }

  return {
    tasks,
    criticalTaskIds: critical,
    projectEarlyFinishEpochMs: projectEarlyFinish,
    projectLateFinishEpochMs: projectEarlyFinish,
    assumptions: CPM_ASSUMPTIONS,
  };
}
