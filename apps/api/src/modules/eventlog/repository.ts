import type pg from "pg";
import type { AppendProjectAuditEventInput, ProjectAuditEvent } from "@alaira/domain/eventlog";
import { EVENTLOG_OUTBOX_EVENT_TYPE } from "@alaira/domain/eventlog";
import type { TenantId } from "@alaira/domain";

type AuditRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  sequence_num: string;
  event_type: string;
  schema_version: number;
  aggregate_id: string | null;
  occurred_at: Date;
  actor_user_id: string;
  correlation_id: string | null;
  causation_id: string | null;
  summary: string;
  payload: Record<string, unknown>;
  evidence_ref: string | null;
  effect: string | null;
};

function mapRow(row: AuditRow): ProjectAuditEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id as TenantId,
    projectId: row.project_id,
    sequenceNum: Number(row.sequence_num),
    eventType: row.event_type,
    schemaVersion: row.schema_version,
    aggregateId: row.aggregate_id ?? undefined,
    occurredAt: row.occurred_at.toISOString(),
    actorUserId: row.actor_user_id,
    correlationId: row.correlation_id ?? undefined,
    causationId: row.causation_id ?? undefined,
    summary: row.summary,
    payload: row.payload ?? {},
    evidenceRef: row.evidence_ref ?? undefined,
    effect: row.effect ?? undefined,
  };
}

export async function findEventlogProject(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
): Promise<{ projectId: string; name: string } | null> {
  const { rows } = await client.query<{ project_id: string; name: string }>(
    `SELECT project_id::text, name FROM eventlog_project
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  const row = rows[0];
  if (!row) return null;
  return { projectId: row.project_id, name: row.name };
}

export async function findIdempotentAuditEventId(
  client: pg.PoolClient,
  tenantId: TenantId,
  idempotencyKey: string,
): Promise<string | null> {
  const { rows } = await client.query<{ audit_event_id: string }>(
    `SELECT audit_event_id::text FROM eventlog_idempotency
     WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey],
  );
  return rows[0]?.audit_event_id ?? null;
}

export async function insertAuditEvent(
  client: pg.PoolClient,
  event: ProjectAuditEvent,
): Promise<ProjectAuditEvent> {
  const { rows } = await client.query<AuditRow>(
    `INSERT INTO project_audit_event (
       id, tenant_id, project_id, event_type, schema_version, aggregate_id,
       occurred_at, actor_user_id, correlation_id, causation_id, summary,
       payload, evidence_ref, effect
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10, $11, $12::jsonb, $13, $14
     )
     RETURNING *`,
    [
      event.id,
      event.tenantId,
      event.projectId,
      event.eventType,
      event.schemaVersion,
      event.aggregateId ?? null,
      event.occurredAt,
      event.actorUserId,
      event.correlationId ?? null,
      event.causationId ?? null,
      event.summary,
      JSON.stringify(event.payload),
      event.evidenceRef ?? null,
      event.effect ?? null,
    ],
  );
  return mapRow(rows[0]!);
}

export async function insertEventlogOutbox(
  client: pg.PoolClient,
  tenantId: TenantId,
  outboxId: string,
  auditEventId: string,
  projectId: string,
  idempotencyKey: string,
  eventType: string,
): Promise<void> {
  await client.query(
    `INSERT INTO outbox_event (id, tenant_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      outboxId,
      tenantId,
      EVENTLOG_OUTBOX_EVENT_TYPE,
      JSON.stringify({
        auditEventId,
        projectId,
        idempotencyKey,
        domainEventType: eventType,
      }),
    ],
  );
}

export async function recordEventlogIdempotency(
  client: pg.PoolClient,
  tenantId: TenantId,
  idempotencyKey: string,
  auditEventId: string,
  outboxEventId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO eventlog_idempotency (tenant_id, idempotency_key, audit_event_id, outbox_event_id)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, idempotencyKey, auditEventId, outboxEventId],
  );
}

export async function findAuditEventById(
  client: pg.PoolClient,
  tenantId: TenantId,
  auditEventId: string,
): Promise<ProjectAuditEvent | null> {
  const { rows } = await client.query<AuditRow>(
    `SELECT * FROM project_audit_event WHERE tenant_id = $1 AND id = $2`,
    [tenantId, auditEventId],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function listAuditEventsForProject(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
): Promise<ProjectAuditEvent[]> {
  const { rows } = await client.query<AuditRow>(
    `SELECT * FROM project_audit_event
     WHERE tenant_id = $1 AND project_id = $2
     ORDER BY sequence_num ASC`,
    [tenantId, projectId],
  );
  return rows.map(mapRow);
}

export async function countAuditEventsForProject(
  client: pg.PoolClient,
  tenantId: TenantId,
  projectId: string,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM project_audit_event
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function countOutboxForIdempotencyKey(
  client: pg.PoolClient,
  tenantId: TenantId,
  idempotencyKey: string,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM outbox_event
     WHERE tenant_id = $1 AND payload->>'idempotencyKey' = $2
       AND event_type = $3`,
    [tenantId, idempotencyKey, EVENTLOG_OUTBOX_EVENT_TYPE],
  );
  return Number(rows[0]?.count ?? 0);
}

export type { AppendProjectAuditEventInput };
