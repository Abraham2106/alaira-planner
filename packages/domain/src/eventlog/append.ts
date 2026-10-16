import { DomainError, type ActorContext, type TenantId } from "../index.js";
import type { AppendProjectAuditEventInput, ProjectAuditEvent } from "./types.js";

function requireNonEmpty(value: string, field: string): void {
  if (!value.trim()) {
    throw new DomainError("VALIDATION", `${field} is required`);
  }
}

export function buildProjectAuditEvent(
  actor: ActorContext,
  projectId: string,
  projectTenantId: TenantId,
  input: AppendProjectAuditEventInput,
  eventId: string,
  occurredAtIso: string,
  sequenceNum: number,
): ProjectAuditEvent {
  if (actor.tenantId !== projectTenantId) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  requireNonEmpty(input.eventType, "eventType");
  requireNonEmpty(input.summary, "summary");

  return {
    id: eventId,
    tenantId: projectTenantId,
    projectId,
    sequenceNum,
    eventType: input.eventType.trim(),
    schemaVersion: 1,
    aggregateId: input.aggregateId,
    occurredAt: occurredAtIso,
    actorUserId: actor.userId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    summary: input.summary.trim(),
    payload: input.payload ?? {},
    evidenceRef: input.evidenceRef,
    effect: input.effect,
  };
}

/** Compensation and corrections are new append-only events, never in-place edits. */
export function buildCompensatingAuditEventInput(
  reversedEventType: string,
  reason: string,
  causationId: string,
): AppendProjectAuditEventInput {
  return {
    eventType: `${reversedEventType}.compensated`,
    summary: reason,
    causationId,
    effect: "compensating_entry",
  };
}
