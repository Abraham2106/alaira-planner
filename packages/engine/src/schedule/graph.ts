import { ScheduleError } from "@alaira/domain/schedule";
import type { ScheduleDependencyDefinition } from "@alaira/domain/schedule";

export type TaskGraph = {
  taskIds: readonly string[];
  successors: Map<string, string[]>;
  predecessors: Map<string, string[]>;
};

export function buildTaskGraph(
  taskIds: readonly string[],
  dependencies: readonly ScheduleDependencyDefinition[],
): TaskGraph {
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const id of taskIds) {
    successors.set(id, []);
    predecessors.set(id, []);
  }
  for (const dep of dependencies) {
    successors.get(dep.predecessorId)!.push(dep.successorId);
    predecessors.get(dep.successorId)!.push(dep.predecessorId);
  }
  return { taskIds, successors, predecessors };
}

/** DFS cycle detection; throws ScheduleError with cycle participant ids. */
export function assertAcyclic(graph: TaskGraph): void {
  const { taskIds, successors } = graph;
  const state = new Map<string, "unvisited" | "visiting" | "done">();
  for (const id of taskIds) {
    state.set(id, "unvisited");
  }
  const stack: string[] = [];

  const visit = (id: string): void => {
    const s = state.get(id);
    if (s === "done") {
      return;
    }
    if (s === "visiting") {
      const cycleStart = stack.indexOf(id);
      const cycle = cycleStart >= 0 ? stack.slice(cycleStart) : [...stack, id];
      throw new ScheduleError("CYCLE", "Dependency cycle detected", { cycle });
    }
    state.set(id, "visiting");
    stack.push(id);
    for (const succ of successors.get(id) ?? []) {
      visit(succ);
    }
    stack.pop();
    state.set(id, "done");
  };

  for (const id of taskIds) {
    if (state.get(id) === "unvisited") {
      visit(id);
    }
  }
}

/** Topological order (predecessors before successors). */
export function topologicalSort(graph: TaskGraph): string[] {
  assertAcyclic(graph);
  const inDegree = new Map<string, number>();
  for (const id of graph.taskIds) {
    inDegree.set(id, graph.predecessors.get(id)?.length ?? 0);
  }
  const queue: string[] = [];
  for (const id of graph.taskIds) {
    if ((inDegree.get(id) ?? 0) === 0) {
      queue.push(id);
    }
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const succ of graph.successors.get(id) ?? []) {
      const next = (inDegree.get(succ) ?? 0) - 1;
      inDegree.set(succ, next);
      if (next === 0) {
        queue.push(succ);
      }
    }
  }
  return order;
}
