import { ScheduleError } from "../schedule/errors.js";
import type { ScheduleDependencyDefinition } from "../schedule/types.js";

export function assertScheduleAcyclic(
  taskIds: readonly string[],
  dependencies: readonly ScheduleDependencyDefinition[],
): void {
  const successors = new Map<string, string[]>();
  for (const id of taskIds) {
    successors.set(id, []);
  }
  for (const dep of dependencies) {
    successors.get(dep.predecessorId)?.push(dep.successorId);
  }

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
