/**
 * Independent reference CPM for small networks (work-minute abstraction, no calendar).
 * Used only in tests to cross-check the calendar-aware engine on DAGs where all tasks
 * share one continuous work timeline (project start = work minute 0).
 */
import type { DependencyType, ScheduleDependencyDefinition } from "@alaira/domain/schedule";

export type OracleTask = { id: string; duration: number };

export type OracleResult = {
  es: Map<string, number>;
  ef: Map<string, number>;
  ls: Map<string, number>;
  lf: Map<string, number>;
  totalFloat: Map<string, number>;
  critical: string[];
};

function oracleConstraintES(
  type: DependencyType,
  lag: number,
  predES: number,
  predEF: number,
  succDuration: number,
): number {
  switch (type) {
    case "FS":
      return predEF + lag;
    case "SS":
      return predES + lag;
    case "FF":
      return predEF + lag - succDuration;
    case "SF":
      return predES + lag - succDuration;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function oracleCpm(
  tasks: readonly OracleTask[],
  dependencies: readonly ScheduleDependencyDefinition[],
  projectStart = 0,
): OracleResult {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const preds = new Map<string, ScheduleDependencyDefinition[]>();
  const succs = new Map<string, ScheduleDependencyDefinition[]>();
  for (const t of tasks) {
    preds.set(t.id, []);
    succs.set(t.id, []);
  }
  for (const d of dependencies) {
    preds.get(d.successorId)!.push(d);
    succs.get(d.predecessorId)!.push(d);
  }

  const inDegree = new Map(tasks.map((t) => [t.id, preds.get(t.id)!.length]));
  const queue = tasks.filter((t) => (inDegree.get(t.id) ?? 0) === 0).map((t) => t.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const d of succs.get(id) ?? []) {
      const deg = (inDegree.get(d.successorId) ?? 0) - 1;
      inDegree.set(d.successorId, deg);
      if (deg === 0) {
        queue.push(d.successorId);
      }
    }
  }

  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  for (const id of order) {
    const task = taskMap.get(id)!;
    let start = projectStart;
    for (const dep of preds.get(id) ?? []) {
      const bound = oracleConstraintES(
        dep.type,
        dep.lagMinutes,
        es.get(dep.predecessorId)!,
        ef.get(dep.predecessorId)!,
        task.duration,
      );
      start = Math.max(start, bound);
    }
    es.set(id, start);
    ef.set(id, start + task.duration);
  }

  const projectEnd = Math.max(...[...ef.values()]);
  const ls = new Map<string, number>();
  const lf = new Map<string, number>();
  for (const id of [...order].reverse()) {
    const task = taskMap.get(id)!;
    const outgoing = succs.get(id) ?? [];
    let finish = projectEnd;
    if (outgoing.length > 0) {
      finish = Math.min(
        ...outgoing.map((dep) => {
          const succLS = ls.get(dep.successorId)!;
          switch (dep.type) {
            case "FS":
              return succLS - dep.lagMinutes;
            case "SS":
              return ls.get(dep.successorId)! - dep.lagMinutes + task.duration;
            case "FF":
              return lf.get(dep.successorId)! - dep.lagMinutes;
            case "SF":
              return lf.get(dep.successorId)! - dep.lagMinutes + task.duration;
            default: {
              const _exhaustive: never = dep.type;
              return _exhaustive;
            }
          }
        }),
      );
    }
    lf.set(id, finish);
    ls.set(id, finish - task.duration);
  }

  const totalFloat = new Map<string, number>();
  const critical: string[] = [];
  for (const t of tasks) {
    const tf = ls.get(t.id)! - es.get(t.id)!;
    totalFloat.set(t.id, tf);
    if (tf === 0) {
      critical.push(t.id);
    }
  }

  return { es, ef, ls, lf, totalFloat, critical };
}
