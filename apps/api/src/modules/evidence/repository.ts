import type pg from "pg";
import type { EvidenceEvent, EvidenceRecord } from "@alaira/domain/evidence";
import type { TenantId } from "@alaira/domain";

type EvidenceRecordRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  kind: EvidenceRecord["kind"];
  title: string;
  description: string | null;
  url: string | null;
  blob_id: string | null;
  work_node_id: string | null;
  metadata: Record<string, unknown>;
  created_by_user_id: string;
  created_at: Date;
};

type EvidenceEventRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  source: string;
  external_id: string;
  dedupe_key: string;
  actor: EvidenceEvent["actor"];
  event_timestamp: Date;
  event_type: EvidenceEvent["eventType"];
  artifact: EvidenceEvent["artifact"];
  project_candidate: string | null;
  work_item_candidate: string | null;
  confidence: number;
  raw_reference: Record<string, unknown>;
  normalized_payload: Record<string, unknown>;
  ai_interpretation: string | null;
  accepted_by: string | null;
  effect: EvidenceEvent["effect"];
  link_state: EvidenceEvent["linkState"];
  link_method: EvidenceEvent["linkMethod"];
  schema_version: number;
  recorded_at: Date;
};

type BlobRow = {
  id: string;
  storage_key: string;
  content_type: string;
};

function mapRecordRow(row: EvidenceRecordRow): EvidenceRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id as TenantId,
    projectId: row.project_id,
    kind: row.kind,
    title: row.title,
    description: row.description ?? undefined,
    url: row.url ?? undefined,
    blobId: row.blob_id ?? undefined,
    workNodeId: row.work_node_id ?? undefined,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at.toISOString(),
    metadata: row.metadata ?? {},
  };
}

function mapEventRow(row: EvidenceEventRow): EvidenceEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id as TenantId,
    projectId: row.project_id,
    source: row.source,
    externalId: row.external_id,
    dedupeKey: row.dedupe_key,
    actor: row.actor,
    timestamp: row.event_timestamp.toISOString(),
    eventType: row.event_type,
    artifact: row.artifact,
    projectCandidate: row.project_candidate,
    workItemCandidate: row.work_item_candidate,
    confidence: row.confidence,
    rawReference: row.raw_reference ?? {},
    normalizedPayload: row.normalized_payload ?? {},
    aiInterpretation: row.ai_interpretation,
    acceptedBy: row.accepted_by,
    effect: row.effect,
    linkState: row.link_state,
    linkMethod: row.link_method,
    schemaVersion: row.schema_version,
    recordedAt: row.recorded_at.toISOString(),
  };
}

export async function findProjectForEvidence(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
): Promise<{ id: string; name: string } | null> {
  const { rows } = await client.query<{ id: string; name: string }>(
    `SELECT id::text, name FROM project WHERE tenant_id = $1 AND id = $2`,
    [tenantId, projectId],
  );
  return rows[0] ?? null;
}

export async function insertEvidenceBlob(
  client: pg.PoolClient,
  tenantId: TenantId,
  blobId: string,
  storageKey: string,
  contentType: string,
  byteSize: number,
  sha256Hex: string,
): Promise<void> {
  await client.query(
    `INSERT INTO evidence_blob (id, tenant_id, storage_key, content_type, byte_size, sha256_hex)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [blobId, tenantId, storageKey, contentType, byteSize, sha256Hex],
  );
}

export async function insertEvidenceRecord(
  client: pg.PoolClient,
  record: EvidenceRecord,
): Promise<EvidenceRecord> {
  const { rows } = await client.query<EvidenceRecordRow>(
    `INSERT INTO evidence_record (
       id, tenant_id, project_id, kind, title, description, url, blob_id,
       work_node_id, metadata, created_by_user_id, created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::timestamptz
     )
     RETURNING *`,
    [
      record.id,
      record.tenantId,
      record.projectId,
      record.kind,
      record.title,
      record.description ?? null,
      record.url ?? null,
      record.blobId ?? null,
      record.workNodeId ?? null,
      JSON.stringify(record.metadata),
      record.createdByUserId,
      record.createdAt,
    ],
  );
  return mapRecordRow(rows[0]!);
}

export async function findEvidenceRecord(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
  evidenceId: string,
): Promise<EvidenceRecord | null> {
  const { rows } = await client.query<EvidenceRecordRow>(
    `SELECT * FROM evidence_record
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, evidenceId],
  );
  const row = rows[0];
  return row ? mapRecordRow(row) : null;
}

export async function findEvidenceBlobMeta(
  client: pg.PoolClient,
  tenantId: TenantId,
  blobId: string,
): Promise<BlobRow | null> {
  const { rows } = await client.query<BlobRow>(
    `SELECT id::text, storage_key, content_type
     FROM evidence_blob WHERE tenant_id = $1 AND id = $2`,
    [tenantId, blobId],
  );
  return rows[0] ?? null;
}

export async function findEvidenceEventByDedupeKey(
  client: pg.PoolClient,
  tenantId: TenantId,
  dedupeKey: string,
): Promise<EvidenceEvent | null> {
  const { rows } = await client.query<EvidenceEventRow>(
    `SELECT * FROM evidence_event WHERE tenant_id = $1 AND dedupe_key = $2`,
    [tenantId, dedupeKey],
  );
  const row = rows[0];
  return row ? mapEventRow(row) : null;
}

export async function insertEvidenceEvent(
  client: pg.PoolClient,
  event: EvidenceEvent,
): Promise<EvidenceEvent> {
  const { rows } = await client.query<EvidenceEventRow>(
    `INSERT INTO evidence_event (
       id, tenant_id, project_id, source, external_id, dedupe_key, actor,
       event_timestamp, event_type, artifact, project_candidate, work_item_candidate,
       confidence, raw_reference, normalized_payload, ai_interpretation, accepted_by,
       effect, link_state, link_method, schema_version, recorded_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::jsonb, $8::timestamptz, $9, $10::jsonb,
       $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17, $18, $19, $20, $21, $22::timestamptz
     )
     RETURNING *`,
    [
      event.id,
      event.tenantId,
      event.projectId,
      event.source,
      event.externalId,
      event.dedupeKey,
      JSON.stringify(event.actor),
      event.timestamp,
      event.eventType,
      event.artifact ? JSON.stringify(event.artifact) : null,
      event.projectCandidate,
      event.workItemCandidate,
      event.confidence,
      JSON.stringify(event.rawReference),
      JSON.stringify(event.normalizedPayload),
      event.aiInterpretation,
      event.acceptedBy,
      event.effect,
      event.linkState,
      event.linkMethod,
      event.schemaVersion,
      event.recordedAt,
    ],
  );
  return mapEventRow(rows[0]!);
}

export async function findEvidenceEventById(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
  eventId: string,
): Promise<EvidenceEvent | null> {
  const { rows } = await client.query<EvidenceEventRow>(
    `SELECT * FROM evidence_event
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, eventId],
  );
  const row = rows[0];
  return row ? mapEventRow(row) : null;
}
