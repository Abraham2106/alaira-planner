import type { TenantId } from "../index.js";

export type EvidenceKind = "link" | "document" | "attestation";

export type EvidenceLinkState = "proposed" | "confirmed" | "rejected" | "unlinked";

export type EvidenceLinkMethod = "rule" | "ai" | "manual" | "none";

export type NormalizedEventKind =
  | "artifact.lifecycle.changed"
  | "user.intent.received"
  | "artifact.activity.detected";

export type EvidenceEffect =
  | "none"
  | "may_propose_progress"
  | "context_only";

export type ExternalActor = {
  externalId: string;
  displayName?: string;
  resolvedUserId: string | null;
};

export type ArtifactRef = {
  externalId: string;
  kind: string;
  url?: string;
};

/** Evidencia documental o enlace adjunta manualmente (REQ-031). */
export type EvidenceRecord = {
  id: string;
  tenantId: TenantId;
  projectId: string;
  kind: EvidenceKind;
  title: string;
  description?: string;
  url?: string;
  blobId?: string;
  workNodeId?: string;
  createdByUserId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

/** EvidenceEvent persistido (REQ-087). */
export type EvidenceEvent = {
  id: string;
  tenantId: TenantId;
  projectId: string;
  source: string;
  externalId: string;
  dedupeKey: string;
  actor: ExternalActor;
  timestamp: string;
  eventType: NormalizedEventKind;
  artifact: ArtifactRef | null;
  projectCandidate: string | null;
  workItemCandidate: string | null;
  confidence: number;
  rawReference: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  aiInterpretation: string | null;
  acceptedBy: string | null;
  effect: EvidenceEffect;
  linkState: EvidenceLinkState;
  linkMethod: EvidenceLinkMethod;
  schemaVersion: number;
  recordedAt: string;
};

export type CreateManualEvidenceInput = {
  kind: EvidenceKind;
  title: string;
  description?: string;
  url?: string;
  workNodeId?: string;
  metadata?: Record<string, unknown>;
};

export type IngestEvidenceEventInput = {
  source: string;
  externalId: string;
  dedupeKey: string;
  actor: ExternalActor;
  timestamp: string;
  eventType: NormalizedEventKind;
  artifact: ArtifactRef | null;
  projectCandidate: string | null;
  workItemCandidate: string | null;
  confidence: number;
  rawReference: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  aiInterpretation: string | null;
  acceptedBy: string | null;
  effect: EvidenceEffect;
  linkState?: EvidenceLinkState;
  linkMethod?: EvidenceLinkMethod;
};
