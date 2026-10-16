import type pg from "pg";
import type { TenantId } from "@alaira/domain";

export type GithubConnectionConfigRow = {
  connection_id: string;
  tenant_id: string;
  project_id: string;
  repository_full_name: string;
};

export type GithubIssueLinkRow = {
  id: string;
  project_id: string;
  work_node_id: string;
};

export type PendingGithubDispatchRow = {
  outbox_id: string;
  tenant_id: string;
  connection_id: string;
  receipt_id: string;
  payload: {
    provider: string;
    eventId: string;
    deliveryId: string;
    resourceId: string;
    normalized: Record<string, unknown>;
  };
};

export async function upsertGithubConnectionConfig(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
  projectId: string,
  repositoryFullName: string,
): Promise<void> {
  await client.query(
    `INSERT INTO github_connection_config (
       connection_id, tenant_id, project_id, repository_full_name
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (connection_id) DO UPDATE SET
       project_id = EXCLUDED.project_id,
       repository_full_name = EXCLUDED.repository_full_name,
       updated_at = now()`,
    [connectionId, tenantId, projectId, repositoryFullName],
  );
}

export async function insertIssueWorkItemLink(
  client: pg.PoolClient,
  tenantId: TenantId,
  linkId: string,
  connectionId: string,
  projectId: string,
  repositoryFullName: string,
  issueNumber: number,
  workNodeId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO github_issue_work_item_link (
       id, tenant_id, connection_id, project_id, repository_full_name, issue_number, work_node_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (tenant_id, connection_id, repository_full_name, issue_number) DO UPDATE SET
       work_node_id = EXCLUDED.work_node_id,
       project_id = EXCLUDED.project_id`,
    [linkId, tenantId, connectionId, projectId, repositoryFullName, issueNumber, workNodeId],
  );
}

export async function findGithubConnectionConfig(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
): Promise<GithubConnectionConfigRow | null> {
  const { rows } = await client.query<GithubConnectionConfigRow>(
    `SELECT connection_id, tenant_id, project_id, repository_full_name
     FROM github_connection_config
     WHERE tenant_id = $1 AND connection_id = $2`,
    [tenantId, connectionId],
  );
  return rows[0] ?? null;
}

export async function findIssueWorkItemLink(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
  repositoryFullName: string,
  issueNumber: number,
): Promise<GithubIssueLinkRow | null> {
  const { rows } = await client.query<GithubIssueLinkRow>(
    `SELECT id, project_id, work_node_id
     FROM github_issue_work_item_link
     WHERE tenant_id = $1 AND connection_id = $2
       AND repository_full_name = $3 AND issue_number = $4`,
    [tenantId, connectionId, repositoryFullName, issueNumber],
  );
  return rows[0] ?? null;
}

export async function listPendingGithubDispatches(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
  limit = 20,
): Promise<PendingGithubDispatchRow[]> {
  const { rows } = await client.query<PendingGithubDispatchRow>(
    `SELECT o.id AS outbox_id, o.tenant_id, o.connection_id, o.receipt_id, o.payload
     FROM connector_fabric_dispatch d
     INNER JOIN connector_fabric_outbox o ON o.id = d.outbox_id
     INNER JOIN connector_connection c ON c.id = o.connection_id AND c.tenant_id = o.tenant_id
     LEFT JOIN github_evidence_ingest g ON g.outbox_id = o.id
     WHERE o.tenant_id = $1 AND o.connection_id = $2
       AND c.provider = 'github'
       AND g.outbox_id IS NULL
     ORDER BY d.dispatched_at ASC
     LIMIT $3`,
    [tenantId, connectionId, limit],
  );
  return rows;
}

export async function insertGithubEvidenceIngest(
  client: pg.PoolClient,
  tenantId: TenantId,
  outboxId: string,
  receiptId: string,
  evidenceEventId: string | null,
  dedupeKey: string,
  status: "ingested" | "skipped" = "ingested",
): Promise<boolean> {
  const { rowCount } = await client.query(
    `INSERT INTO github_evidence_ingest (
       outbox_id, tenant_id, receipt_id, evidence_event_id, dedupe_key, status
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (outbox_id) DO NOTHING`,
    [outboxId, tenantId, receiptId, evidenceEventId, dedupeKey, status],
  );
  return (rowCount ?? 0) > 0;
}

export async function findConnectionProvider(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
): Promise<string | null> {
  const { rows } = await client.query<{ provider: string }>(
    `SELECT provider FROM connector_connection WHERE tenant_id = $1 AND id = $2`,
    [tenantId, connectionId],
  );
  return rows[0]?.provider ?? null;
}
