import { DomainError } from "../index.js";
import type { DeliveryProfile, ExecutionMode, PlanningMode } from "./types.js";
import { EXECUTION_MODES, FINANCIAL_CONTROL_LEVELS, PLANNING_MODES } from "./types.js";

export function isPlanningMode(value: string): value is PlanningMode {
  return (PLANNING_MODES as readonly string[]).includes(value);
}

export function isExecutionMode(value: string): value is ExecutionMode {
  return (EXECUTION_MODES as readonly string[]).includes(value);
}

export function assertDeliveryProfile(input: DeliveryProfile): DeliveryProfile {
  if (!isPlanningMode(input.planningMode)) {
    throw new DomainError("VALIDATION", "Invalid planningMode");
  }
  if (!(FINANCIAL_CONTROL_LEVELS as readonly string[]).includes(input.financialControl)) {
    throw new DomainError("VALIDATION", "Invalid financialControl");
  }
  return input;
}

/** Branch execution view: explicit override or project default when not hybrid. */
export function resolveEffectiveExecutionMode(
  projectProfile: DeliveryProfile,
  override: ExecutionMode | null | undefined,
): ExecutionMode {
  if (override) return override;
  if (projectProfile.planningMode === "hybrid") {
    throw new DomainError("VALIDATION", "Hybrid project branches require execution_mode_override");
  }
  if (projectProfile.planningMode === "predictive") return "predictive";
  if (projectProfile.planningMode === "scrum") return "scrum";
  return "kanban";
}
