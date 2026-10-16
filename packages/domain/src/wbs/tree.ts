import { DomainError } from "../index.js";

export type HierarchyEdge = {
  parentId: string;
  childId: string;
};

const WBS_CODE_PATTERN = /^[0-9]+(\.[0-9]+)*$/;

export function assertValidWbsCode(code: string): string {
  const trimmed = code.trim();
  if (!WBS_CODE_PATTERN.test(trimmed)) {
    throw new DomainError("VALIDATION", "Invalid WBS code format");
  }
  return trimmed;
}

export function collectDescendants(
  edges: readonly HierarchyEdge[],
  rootId: string,
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const edge of edges) {
    const list = childrenOf.get(edge.parentId) ?? [];
    list.push(edge.childId);
    childrenOf.set(edge.parentId, list);
  }
  const seen = new Set<string>([rootId]);
  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const child of childrenOf.get(current) ?? []) {
      if (!seen.has(child)) {
        seen.add(child);
        stack.push(child);
      }
    }
  }
  return seen;
}

/** True if assigning `childId` under `newParentId` would create a cycle. */
export function wouldCreateCycle(
  edges: readonly HierarchyEdge[],
  newParentId: string,
  childId: string,
): boolean {
  if (newParentId === childId) {
    return true;
  }
  const subtree = collectDescendants(edges, childId);
  return subtree.has(newParentId);
}

export function assertNoHierarchyCycle(
  edges: readonly HierarchyEdge[],
  newParentId: string,
  childId: string,
): void {
  if (wouldCreateCycle(edges, newParentId, childId)) {
    throw new DomainError("VALIDATION", "Hierarchy would contain a cycle");
  }
}
