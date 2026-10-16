import type { OverassignmentConflict, PersonResourceDefinition, ResourceAssignmentDefinition, TaskAssignmentWindow } from "@alaira/domain/capacity";

type TimedAssignment = {
  personId: string;
  startEpochMs: number;
  finishEpochMs: number;
  units: number;
};

function windowsByTask(windows: readonly TaskAssignmentWindow[]): Map<string, TaskAssignmentWindow> {
  return new Map(windows.map((w) => [w.taskId, w]));
}

function timedAssignments(
  assignments: readonly ResourceAssignmentDefinition[],
  byTask: Map<string, TaskAssignmentWindow>,
): TimedAssignment[] {
  const out: TimedAssignment[] = [];
  for (const a of assignments) {
    const w = byTask.get(a.taskId)!;
    if (w.finishEpochMs <= w.startEpochMs) {
      continue;
    }
    out.push({
      personId: a.personId,
      startEpochMs: w.startEpochMs,
      finishEpochMs: w.finishEpochMs,
      units: a.units,
    });
  }
  return out;
}

function conflictsForPerson(
  personId: string,
  maxUnits: number,
  segments: TimedAssignment[],
): OverassignmentConflict[] {
  if (segments.length === 0) {
    return [];
  }
  const boundaries = new Set<number>();
  for (const s of segments) {
    boundaries.add(s.startEpochMs);
    boundaries.add(s.finishEpochMs);
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  const conflicts: OverassignmentConflict[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!;
    const end = sorted[i + 1]!;
    if (end <= start) {
      continue;
    }
    let assignedUnits = 0;
    for (const s of segments) {
      if (s.startEpochMs <= start && s.finishEpochMs > start) {
        assignedUnits += s.units;
      }
    }
    if (assignedUnits > maxUnits + 1e-9) {
      conflicts.push({
        personId,
        intervalStartEpochMs: start,
        intervalEndEpochMs: end,
        assignedUnits,
        maxUnits,
      });
    }
  }
  return conflicts;
}

export function detectOverassignments(
  people: readonly PersonResourceDefinition[],
  assignments: readonly ResourceAssignmentDefinition[],
  taskWindows: readonly TaskAssignmentWindow[],
): OverassignmentConflict[] {
  const byTask = windowsByTask(taskWindows);
  const timed = timedAssignments(assignments, byTask);
  const byPerson = new Map<string, TimedAssignment[]>();
  for (const t of timed) {
    const list = byPerson.get(t.personId) ?? [];
    list.push(t);
    byPerson.set(t.personId, list);
  }

  const conflicts: OverassignmentConflict[] = [];
  for (const person of people) {
    const maxUnits = person.maxUnits ?? 1;
    const segs = byPerson.get(person.id) ?? [];
    conflicts.push(...conflictsForPerson(person.id, maxUnits, segs));
  }
  return conflicts;
}
