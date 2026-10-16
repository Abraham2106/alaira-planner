import { z } from "zod";
import {
  ArtifactRefSchema,
  EvidenceEffectSchema,
  ExternalActorSchema,
  NormalizedEventKindSchema,
} from "../connectors/evidence.js";

export const context = "evidence";

const externalId = z.string().min(4).max(64);
const uuid = z.string().uuid();

const evidenceKind = z.enum(["link", "document", "attestation"]);
const linkState = z.enum(["proposed", "confirmed", "rejected", "unlinked"]);
const linkMethod = z.enum(["rule", "ai", "manual", "none"]);

const EvidenceRecord = z.object({
  id: externalId,
  tenantId: externalId,
  projectId: externalId,
  kind: evidenceKind,
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  blobId: externalId.optional(),
  workNodeId: externalId.optional(),
  createdByUserId: externalId,
  createdAt: z.string(),
  metadata: z.record(z.unknown()),
});

const EvidenceEvent = z.object({
  id: externalId,
  tenantId: externalId,
  projectId: externalId,
  source: z.string(),
  externalId: z.string(),
  dedupeKey: z.string(),
  actor: ExternalActorSchema,
  timestamp: z.string().datetime(),
  eventType: NormalizedEventKindSchema,
  artifact: ArtifactRefSchema.nullable(),
  projectCandidate: uuid.nullable(),
  workItemCandidate: uuid.nullable(),
  confidence: z.number().min(0).max(1),
  rawReference: z.record(z.unknown()),
  normalizedPayload: z.record(z.unknown()),
  aiInterpretation: z.string().nullable(),
  acceptedBy: uuid.nullable(),
  effect: EvidenceEffectSchema,
  linkState,
  linkMethod,
  schemaVersion: z.number().int().positive(),
  recordedAt: z.string().datetime(),
});

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  EvidenceParams: z.object({
    projectId: externalId,
    evidenceId: externalId,
  }),
  EvidenceEventParams: z.object({
    projectId: externalId,
    eventId: externalId,
  }),
  CreateManualEvidenceBody: z.object({
    kind: evidenceKind,
    title: z.string().min(1).max(512),
    description: z.string().max(4000).optional(),
    url: z.string().url().max(2048).optional(),
    workNodeId: externalId.optional(),
    metadata: z.record(z.unknown()).optional(),
    /** Base64 sintético para pruebas; máx. 256 KiB decodificado. */
    contentBase64: z.string().max(350_000).optional(),
    contentType: z.string().max(128).optional(),
  }),
  EvidenceRecordResponse: z.object({
    record: EvidenceRecord,
  }),
  IngestEvidenceEventBody: z.object({
    source: z.string().min(1).max(128),
    externalId: z.string().min(1).max(256),
    dedupeKey: z.string().min(1).max(512),
    actor: ExternalActorSchema,
    timestamp: z.string().datetime(),
    eventType: NormalizedEventKindSchema,
    artifact: ArtifactRefSchema.nullable(),
    projectCandidate: uuid.nullable(),
    workItemCandidate: uuid.nullable(),
    confidence: z.number().min(0).max(1),
    rawReference: z.record(z.unknown()),
    normalizedPayload: z.record(z.unknown()),
    aiInterpretation: z.string().nullable(),
    acceptedBy: uuid.nullable(),
    effect: EvidenceEffectSchema,
    linkState: linkState.optional(),
    linkMethod: linkMethod.optional(),
  }),
  EvidenceEventResponse: z.object({
    event: EvidenceEvent,
  }),
};
