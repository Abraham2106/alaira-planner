import { DomainError } from "../index.js";
import type { AcceptanceCriterionSet } from "../wbs/types.js";
import type { CriterionEvaluation } from "./types.js";

export function assertRequiredCriteriaSatisfied(
  criteria: AcceptanceCriterionSet,
  evaluations: readonly CriterionEvaluation[],
): void {
  const byKey = new Map(evaluations.map((e) => [e.key.trim(), e.satisfied]));
  const missing: string[] = [];
  for (const item of criteria.criteria) {
    if (!item.required) continue;
    if (!byKey.get(item.key)) missing.push(item.key);
  }
  if (missing.length > 0) {
    throw new DomainError(
      "VALIDATION",
      `Required acceptance criteria not satisfied: ${missing.join(", ")}`,
    );
  }
}
