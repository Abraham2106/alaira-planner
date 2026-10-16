import { DomainError } from "../index.js";
import type { RollupLeafInput } from "./types.js";
import { clampProgressPercent } from "./progress-strategy.js";

export function computeWeightedRollup(leaves: readonly RollupLeafInput[]): number {
  if (leaves.length === 0) return 0;
  let numerator = 0;
  let denominator = 0;
  for (const leaf of leaves) {
    if (leaf.weight <= 0) {
      throw new DomainError("VALIDATION", "Rollup weight must be positive");
    }
    numerator += leaf.weight * clampProgressPercent(leaf.progressPercent);
    denominator += leaf.weight;
  }
  return denominator === 0 ? 0 : clampProgressPercent(numerator / denominator);
}

export function pickRollupLeaves(
  nodeIds: readonly string[],
  edges: readonly { parentId: string; childId: string }[],
  progressByNode: ReadonlyMap<string, number>,
  weightByNode: ReadonlyMap<string, number>,
): RollupLeafInput[] {
  const nodeSet = new Set(nodeIds);
  const hasChild = new Set<string>();
  for (const edge of edges) {
    if (nodeSet.has(edge.parentId) && nodeSet.has(edge.childId)) {
      hasChild.add(edge.parentId);
    }
  }
  const leaves: RollupLeafInput[] = [];
  for (const id of nodeIds) {
    if (hasChild.has(id)) continue;
    leaves.push({
      workNodeId: id,
      weight: weightByNode.get(id) ?? 1,
      progressPercent: progressByNode.get(id) ?? 0,
    });
  }
  return leaves;
}
