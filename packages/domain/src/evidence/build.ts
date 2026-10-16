import { DomainError, type ActorContext, type TenantId } from "../index.js";
import type {
  CreateManualEvidenceInput,
  EvidenceEvent,
  EvidenceLinkMethod,
  EvidenceLinkState,
  EvidenceRecord,
  IngestEvidenceEventInput,
} from "./types.js";

function requireNonEmpty(value: string, field: string): void {
  if (!value.trim()) {
    throw new DomainError("VALIDATION", `${field} is required`);
  }
}

export function assertManualEvidenceInput(input: CreateManualEvidenceInput): CreateManualEvidenceInput {
  requireNonEmpty(input.title, "title");
  if (input.kind === "link") {
    if (!input.url?.trim()) {
      throw new DomainError("VALIDATION", "url is required for link evidence");
    }
  }
  if (input.kind === "document" || input.kind === "attestation") {
    const hasUrl = Boolean(input.url?.trim());
    const hasDescription = Boolean(input.description?.trim());
    if (!hasUrl && !hasDescription) {
      throw new DomainError(
        "VALIDATION",
        "document or attestation evidence requires url or description",
      );
    }
  }
  return input;
}

export function buildEvidenceRecord(
  actor: ActorContext,
  projectId: string,
  projectTenantId: TenantId,
  input: CreateManualEvidenceInput,
  recordId: string,
  createdAtIso: string,
): EvidenceRecord {
  if (actor.tenantId !== projectTenantId) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  const validated = assertManualEvidenceInput(input);
  return {
    id: recordId,
    tenantId: projectTenantId,
    projectId,
    kind: validated.kind,
    title: validated.title.trim(),
    description: validated.description?.trim(),
    url: validated.url?.trim(),
    workNodeId: validated.workNodeId,
    createdByUserId: actor.userId,
    createdAt: createdAtIso,
    metadata: validated.metadata ?? {},
  };
}

function resolveLinkState(
  input: IngestEvidenceEventInput,
): { linkState: EvidenceLinkState; linkMethod: EvidenceLinkMethod } {
  const linkState = input.linkState ?? inferLinkState(input);
  const linkMethod =
    input.linkMethod ??
    (linkState === "unlinked" ? "none" : input.confidence >= 0.85 ? "rule" : "ai");
  return { linkState, linkMethod };
}

function inferLinkState(input: IngestEvidenceEventInput): EvidenceLinkState {
  if (input.workItemCandidate && input.confidence >= 0.5) {
    return input.confidence >= 0.85 ? "confirmed" : "proposed";
  }
  return "unlinked";
}

export function buildEvidenceEvent(
  tenantId: TenantId,
  projectId: string,
  input: IngestEvidenceEventInput,
  eventId: string,
  recordedAtIso: string,
): EvidenceEvent {
  requireNonEmpty(input.source, "source");
  requireNonEmpty(input.externalId, "externalId");
  requireNonEmpty(input.dedupeKey, "dedupeKey");
  requireNonEmpty(input.actor.externalId, "actor.externalId");
  if (input.confidence < 0 || input.confidence > 1) {
    throw new DomainError("VALIDATION", "confidence must be between 0 and 1");
  }

  const { linkState, linkMethod } = resolveLinkState(input);

  return {
    id: eventId,
    tenantId,
    projectId,
    source: input.source.trim(),
    externalId: input.externalId.trim(),
    dedupeKey: input.dedupeKey.trim(),
    actor: input.actor,
    timestamp: input.timestamp,
    eventType: input.eventType,
    artifact: input.artifact,
    projectCandidate: input.projectCandidate,
    workItemCandidate: input.workItemCandidate,
    confidence: input.confidence,
    rawReference: input.rawReference,
    normalizedPayload: input.normalizedPayload,
    aiInterpretation: input.aiInterpretation,
    acceptedBy: input.acceptedBy,
    effect: input.effect,
    linkState,
    linkMethod,
    schemaVersion: 1,
    recordedAt: recordedAtIso,
  };
}

/** Normaliza clave de deduplicación para comparación estable. */
export function normalizeDedupeKey(source: string, dedupeKey: string): string {
  return `${source.trim().toLowerCase()}::${dedupeKey.trim()}`;
}
