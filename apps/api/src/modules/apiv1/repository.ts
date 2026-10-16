import type pg from "pg";
import type { DeliveryProfile } from "@alaira/domain/project";

export type ProjectSearchRow = {
  id: string;
  name: string;
  delivery_profile: DeliveryProfile;
  version: number;
};

export async function countSearchableProjects(
  client: pg.PoolClient,
  tenantId: string,
  userId: string,
  q: string | undefined,
  planningMode: string | undefined,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM project p
     INNER JOIN authz_project_membership m
       ON m.tenant_id = p.tenant_id AND m.project_id = p.id AND m.user_id = $2
     WHERE p.tenant_id = $1
       AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%')
       AND ($4::text IS NULL OR p.delivery_profile->>'planningMode' = $4)`,
    [tenantId, userId, q ?? null, planningMode ?? null],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function searchProjectsForUser(
  client: pg.PoolClient,
  tenantId: string,
  userId: string,
  q: string | undefined,
  planningMode: string | undefined,
  offset: number,
  limit: number,
): Promise<ProjectSearchRow[]> {
  const { rows } = await client.query<ProjectSearchRow>(
    `SELECT p.id, p.name, p.delivery_profile, p.version
     FROM project p
     INNER JOIN authz_project_membership m
       ON m.tenant_id = p.tenant_id AND m.project_id = p.id AND m.user_id = $2
     WHERE p.tenant_id = $1
       AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%')
       AND ($4::text IS NULL OR p.delivery_profile->>'planningMode' = $4)
     ORDER BY p.created_at DESC
     OFFSET $5 LIMIT $6`,
    [tenantId, userId, q ?? null, planningMode ?? null, offset, limit],
  );
  return rows;
}

export async function listProjectsForExport(
  client: pg.PoolClient,
  tenantId: string,
  userId: string,
): Promise<ProjectSearchRow[]> {
  const { rows } = await client.query<ProjectSearchRow>(
    `SELECT p.id, p.name, p.delivery_profile, p.version
     FROM project p
     INNER JOIN authz_project_membership m
       ON m.tenant_id = p.tenant_id AND m.project_id = p.id AND m.user_id = $2
     WHERE p.tenant_id = $1
     ORDER BY p.name ASC`,
    [tenantId, userId],
  );
  return rows;
}

type AuditSearchRow = {
  id: string;
  sequence_num: string;
  event_type: string;
  summary: string;
  occurred_at: Date;
  payload: Record<string, unknown>;
  actor_user_id: string;
  project_id: string;
};

export async function countAuditEventsFiltered(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  eventType: string | undefined,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM project_audit_event
     WHERE tenant_id = $1 AND project_id = $2
       AND ($3::text IS NULL OR event_type = $3)`,
    [tenantId, projectId, eventType ?? null],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function searchAuditEvents(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  eventType: string | undefined,
  offset: number,
  limit: number,
): Promise<AuditSearchRow[]> {
  const { rows } = await client.query<AuditSearchRow>(
    `SELECT id, sequence_num, event_type, summary, occurred_at, payload, actor_user_id, project_id
     FROM project_audit_event
     WHERE tenant_id = $1 AND project_id = $2
       AND ($3::text IS NULL OR event_type = $3)
     ORDER BY sequence_num ASC
     OFFSET $4 LIMIT $5`,
    [tenantId, projectId, eventType ?? null, offset, limit],
  );
  return rows;
}

export async function findProjectGraphByExternalId(
  client: pg.PoolClient,
  tenantId: string,
  projectUuid: string,
): Promise<{ id: string } | null> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id::text FROM project WHERE tenant_id = $1 AND id = $2`,
    [tenantId, projectUuid],
  );
  return rows[0] ?? null;
}

export async function findEventlogAnchor(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<{ project_id: string } | null> {
  const { rows } = await client.query<{ project_id: string }>(
    `SELECT project_id::text FROM eventlog_project
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return rows[0] ?? null;
}
