import { DomainError } from "../index.js";
import type { AcceptanceCriterionItem, AcceptanceCriterionSet } from "./types.js";

export function assertNonEmptyCriteria(
  criteria: readonly AcceptanceCriterionItem[],
): AcceptanceCriterionItem[] {
  if (criteria.length === 0) {
    throw new DomainError("VALIDATION", "At least one acceptance criterion is required");
  }
  for (const item of criteria) {
    if (!item.text.trim()) {
      throw new DomainError("VALIDATION", "Criterion text cannot be empty");
    }
  }
  return criteria.map((item) => ({
    key: item.key.trim(),
    text: item.text.trim(),
    required: item.required,
  }));
}

export function nextCriterionVersion(currentMax: number): number {
  return currentMax + 1;
}

export function buildCriterionSet(
  version: number,
  criteria: readonly AcceptanceCriterionItem[],
): AcceptanceCriterionSet {
  return {
    version,
    criteria: assertNonEmptyCriteria(criteria),
  };
}

/** REQ-016 (config gate): deliverable cannot be marked acceptance-ready without criteria. */
export function assertAcceptanceCriteriaConfigured(
  latest: AcceptanceCriterionSet | null,
): void {
  if (!latest || latest.criteria.length === 0) {
    throw new DomainError(
      "VALIDATION",
      "Acceptance criteria must be configured before acceptance",
    );
  }
}
