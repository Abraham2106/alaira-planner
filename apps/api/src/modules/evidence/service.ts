import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import {
  buildEvidenceEvent,
  buildEvidenceRecord,
  parseEvidenceExternalId,
  toEvidenceExternalId,
  type CreateManualEvidenceInput,
  type EvidenceEvent,
  type EvidenceRecord,
  type IngestEvidenceEventInput,
} from "@alaira/domain/evidence";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import { toExternalId } from "@alaira/domain/iam";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import { getEvidenceBlobStore } from "./blob-store.js";
import {
  findEvidenceBlobMeta,
  findEvidenceEventByDedupeKey,
  findEvidenceEventById,
  findEvidenceRecord,
  findProjectForEvidence,
  insertEvidenceBlob,
  insertEvidenceEvent,
  insertEvidenceRecord,
} from "./repository.js";

function parseProjectId(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parseEvidenceId(external: string): string {
  const id = parseEvidenceExternalId(external, "evidence");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parseEvidenceEventId(external: string): string {
  const id = parseEvidenceExternalId(external, "evidenceEvent");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parseWorkNodeId(external: string | undefined): string | undefined {
  if (!external) return undefined;
  const id = parseProjectExternalId(external, "workNode");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

async function assertProjectRead(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:read", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
}

async function assertProjectWrite(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:write", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
}

export type EvidenceRecordDto = {
  id: string;
  tenantId: string;
  projectId: string;
  kind: EvidenceRecord["kind"];
  title: string;
  description?: string;
  url?: string;
  blobId?: string;
  workNodeId?: string;
  createdByUserId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type EvidenceEventDto = {
  id: string;
  tenantId: string;
  projectId: string;
  source: string;
  externalId: string;
  dedupeKey: string;
  actor: EvidenceEvent["actor"];
  timestamp: string;
  eventType: EvidenceEvent["eventType"];
  artifact: EvidenceEvent["artifact"];
  projectCandidate: string | null;
  workItemCandidate: string | null;
  confidence: number;
  rawReference: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  aiInterpretation: string | null;
  acceptedBy: string | null;
  effect: EvidenceEvent["effect"];
  linkState: EvidenceEvent["linkState"];
  linkMethod: EvidenceEvent["linkMethod"];
  schemaVersion: number;
  recordedAt: string;
};

function mapRecordDto(record: EvidenceRecord): EvidenceRecordDto {
  return {
    id: toEvidenceExternalId("evidence", record.id),
    tenantId: toExternalId("tenant", record.tenantId),
    projectId: toProjectExternalId("project", record.projectId),
    kind: record.kind,
    title: record.title,
    description: record.description,
    url: record.url,
    blobId: record.blobId ? toEvidenceExternalId("blob", record.blobId) : undefined,
    workNodeId: record.workNodeId
      ? toProjectExternalId("workNode", record.workNodeId)
      : undefined,
    createdByUserId: toExternalId("user", record.createdByUserId),
    createdAt: record.createdAt,
    metadata: record.metadata,
  };
}

function mapEventDto(event: EvidenceEvent): EvidenceEventDto {
  return {
    id: toEvidenceExternalId("evidenceEvent", event.id),
    tenantId: toExternalId("tenant", event.tenantId),
    projectId: toProjectExternalId("project", event.projectId),
    source: event.source,
    externalId: event.externalId,
    dedupeKey: event.dedupeKey,
    actor: {
      ...event.actor,
      resolvedUserId: event.actor.resolvedUserId,
    },
    timestamp: event.timestamp,
    eventType: event.eventType,
    artifact: event.artifact,
    projectCandidate: event.projectCandidate,
    workItemCandidate: event.workItemCandidate,
    confidence: event.confidence,
    rawReference: event.rawReference,
    normalizedPayload: event.normalizedPayload,
    aiInterpretation: event.aiInterpretation,
    acceptedBy: event.acceptedBy,
    effect: event.effect,
    linkState: event.linkState,
    linkMethod: event.linkMethod,
    schemaVersion: event.schemaVersion,
    recordedAt: event.recordedAt,
  };
}

const MAX_INLINE_BYTES = 256 * 1024;

export async function createManualEvidenceCommand(
  session: IamSession,
  projectExternalId: string,
  input: CreateManualEvidenceInput,
  contentBase64?: string,
  contentType?: string,
): Promise<EvidenceRecordDto> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectForEvidence(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const workNodeId = parseWorkNodeId(input.workNodeId);
    const recordId = uuidv7();
    const createdAt = new Date().toISOString();
    let blobId: string | undefined;
    const manualInput: CreateManualEvidenceInput =
      contentBase64?.trim() && !input.description?.trim() && !input.url?.trim()
        ? { ...input, workNodeId, description: "Attached binary evidence" }
        : { ...input, workNodeId };

    if (contentBase64?.trim()) {
      const bytes = Buffer.from(contentBase64, "base64");
      if (bytes.byteLength > MAX_INLINE_BYTES) {
        throw new DomainError("VALIDATION", "content exceeds size limit");
      }
      blobId = uuidv7();
      const stored = await getEvidenceBlobStore().put(
        session.tenantId,
        blobId,
        contentType?.trim() || "application/octet-stream",
        bytes,
      );
      await insertEvidenceBlob(
        client,
        session.tenantId,
        blobId,
        stored.storageKey,
        stored.contentType,
        stored.byteSize,
        stored.sha256Hex,
      );
    }

    const draft = buildEvidenceRecord(
      { tenantId: session.tenantId, userId: session.userId, roles: [] },
      projectId,
      session.tenantId,
      manualInput,
      recordId,
      createdAt,
    );
    const withBlob = blobId ? { ...draft, blobId } : draft;
    const persisted = await insertEvidenceRecord(client, withBlob);
    return mapRecordDto(persisted);
  });
}

export async function getEvidenceRecordCommand(
  session: IamSession,
  projectExternalId: string,
  evidenceExternalId: string,
): Promise<EvidenceRecordDto> {
  const projectId = parseProjectId(projectExternalId);
  const evidenceId = parseEvidenceId(evidenceExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const record = await findEvidenceRecord(client, session.tenantId, projectId, evidenceId);
    if (!record) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return mapRecordDto(record);
  });
}

export async function getEvidenceBlobCommand(
  session: IamSession,
  projectExternalId: string,
  evidenceExternalId: string,
): Promise<{ contentType: string; bytes: Buffer }> {
  const projectId = parseProjectId(projectExternalId);
  const evidenceId = parseEvidenceId(evidenceExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const record = await findEvidenceRecord(client, session.tenantId, projectId, evidenceId);
    if (!record?.blobId) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const meta = await findEvidenceBlobMeta(client, session.tenantId, record.blobId);
    if (!meta) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const bytes = await getEvidenceBlobStore().get(session.tenantId, meta.storage_key);
    return { contentType: meta.content_type, bytes };
  });
}

export async function ingestEvidenceEventCommand(
  session: IamSession,
  projectExternalId: string,
  input: IngestEvidenceEventInput,
): Promise<{ event: EvidenceEventDto; created: boolean }> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectForEvidence(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const existing = await findEvidenceEventByDedupeKey(
      client,
      session.tenantId,
      input.dedupeKey.trim(),
    );
    if (existing) {
      if (existing.projectId !== projectId) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      return { event: mapEventDto(existing), created: false };
    }

    const eventId = uuidv7();
    const recordedAt = new Date().toISOString();
    const draft = buildEvidenceEvent(session.tenantId, projectId, input, eventId, recordedAt);
    const persisted = await insertEvidenceEvent(client, draft);
    return { event: mapEventDto(persisted), created: true };
  });
}

export async function getEvidenceEventCommand(
  session: IamSession,
  projectExternalId: string,
  eventExternalId: string,
): Promise<EvidenceEventDto> {
  const projectId = parseProjectId(projectExternalId);
  const eventId = parseEvidenceEventId(eventExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const event = await findEvidenceEventById(client, session.tenantId, projectId, eventId);
    if (!event) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return mapEventDto(event);
  });
}
