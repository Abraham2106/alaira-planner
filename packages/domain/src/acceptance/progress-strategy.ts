import { DomainError } from "../index.js";
import type { AcceptanceStatus, WeightedChecklistConfig } from "./types.js";

export function clampProgressPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new DomainError("VALIDATION", "Progress must be between 0 and 100");
  }
  return Math.round(value);
}

export function progressFromDeliverableAcceptance(acceptanceStatus: AcceptanceStatus): number {
  return acceptanceStatus === "accepted" ? 100 : 0;
}

export function progressFromManualPercent(manualPercent: number): number {
  return clampProgressPercent(manualPercent);
}

export function progressFromWeightedChecklist(
  config: WeightedChecklistConfig,
  completedKeys: ReadonlySet<string>,
): number {
  if (config.items.length === 0) {
    throw new DomainError("VALIDATION", "Weighted checklist requires at least one item");
  }
  let numerator = 0;
  let denominator = 0;
  for (const item of config.items) {
    if (item.weight <= 0) {
      throw new DomainError("VALIDATION", "Checklist item weight must be positive");
    }
    denominator += item.weight;
    if (completedKeys.has(item.key)) numerator += item.weight;
  }
  return denominator === 0 ? 0 : clampProgressPercent((numerator / denominator) * 100);
}

export function defaultStrategyForNodeType(nodeType: string): "deliverable_acceptance" | "manual" {
  return nodeType === "deliverable" ? "deliverable_acceptance" : "manual";
}
