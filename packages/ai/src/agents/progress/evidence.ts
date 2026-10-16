import type { ProgressEvidenceInput } from "./types.js";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Maps connector evidence (synthetic GitHub, TASK-0120) to acceptance checklist keys.
 * Ambiguous or context-only events do not satisfy criteria (TC-EV-04 / SECURITY_PRIVACY).
 */
export function criterionKeysFromEvidence(event: ProgressEvidenceInput): string[] {
  if (event.effect !== "may_propose_progress") {
    return [];
  }

  const keys: string[] = [];
  const artifactKind = event.artifact?.kind ?? "";

  if (artifactKind === "pull_request_merged" || event.externalId.includes("merged")) {
    keys.push("pr_merged");
  }

  const payload = event.normalizedPayload ?? {};
  const review = asRecord(payload.review);
  if (review && review.state === "approved") {
    keys.push("review_ok");
  }
  if (event.externalId.includes("review") && review?.state === "approved") {
    keys.push("review_ok");
  }

  const checkRun = asRecord(payload.check_run);
  if (checkRun?.conclusion === "success") {
    keys.push("checks_green");
  }
  const checkSuite = asRecord(payload.check_suite);
  if (checkSuite?.conclusion === "success") {
    keys.push("checks_green");
  }

  if (
    event.eventType === "artifact.lifecycle.changed" &&
    event.source === "github" &&
    artifactKind === "pull_request_merged"
  ) {
    keys.push("pr_merged");
  }

  return [...new Set(keys)];
}

export function gatherCriterionKeysFromEvidence(events: readonly ProgressEvidenceInput[]): string[] {
  const merged = new Set<string>();
  for (const event of events) {
    for (const key of criterionKeysFromEvidence(event)) {
      merged.add(key);
    }
  }
  return [...merged];
}
