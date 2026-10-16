import type { TenantId } from "@alaira/domain";
import type pg from "pg";

export type PendingRequestRow = {
  id: string;
  status: string;
  response_message: string;
  fabric_receipt_id: string;
};

export async function findIdentityLink(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
  slackUserId: string,
): Promise<{ app_user_id: string } | null> {
  const { rows } = await client.query<{ app_user_id: string }>(
    `SELECT app_user_id FROM slack_identity_link
     WHERE tenant_id = $1 AND connection_id = $2 AND slack_user_id = $3`,
    [tenantId, connectionId, slackUserId],
  );
  return rows[0] ?? null;
}

export async function upsertIdentityLink(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
  slackUserId: string,
  appUserId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO slack_identity_link (tenant_id, connection_id, slack_user_id, app_user_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, connection_id, slack_user_id)
     DO UPDATE SET app_user_id = EXCLUDED.app_user_id`,
    [tenantId, connectionId, slackUserId, appUserId],
  );
}

export async function findPendingByDedup(
  client: pg.PoolClient,
  tenantId: TenantId,
  connectionId: string,
  dedupKey: string,
): Promise<PendingRequestRow | null> {
  const { rows } = await client.query<PendingRequestRow>(
    `SELECT id, status, response_message, fabric_receipt_id
     FROM slack_intake_pending_request
     WHERE tenant_id = $1 AND connection_id = $2 AND dedup_key = $3`,
    [tenantId, connectionId, dedupKey],
  );
  return rows[0] ?? null;
}

export async function insertPendingRequest(
  client: pg.PoolClient,
  row: {
    id: string;
    tenantId: TenantId;
    connectionId: string;
    fabricReceiptId: string;
    dedupKey: string;
    slackUserId: string;
    appUserId: string | null;
    intent: string;
    status: string;
    projectId: string | null;
    workItemHint: string | null;
    projectHint: string | null;
    userMessage: string;
    responseMessage: string;
  },
): Promise<boolean> {
  const result = await client.query(
    `INSERT INTO slack_intake_pending_request (
       id, tenant_id, connection_id, fabric_receipt_id, dedup_key,
       slack_user_id, app_user_id, intent, status, project_id,
       work_item_hint, project_hint, user_message, response_message
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (tenant_id, connection_id, dedup_key) DO NOTHING`,
    [
      row.id,
      row.tenantId,
      row.connectionId,
      row.fabricReceiptId,
      row.dedupKey,
      row.slackUserId,
      row.appUserId,
      row.intent,
      row.status,
      row.projectId,
      row.workItemHint,
      row.projectHint,
      row.userMessage,
      row.responseMessage,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function findProjectByNameHint(
  client: pg.PoolClient,
  tenantId: TenantId,
  nameHint: string,
): Promise<{ id: string; name: string } | null> {
  const { rows } = await client.query<{ id: string; name: string }>(
    `SELECT id, name FROM project
     WHERE tenant_id = $1 AND lower(name) = lower($2)
     LIMIT 2`,
    [tenantId, nameHint.trim()],
  );
  if (rows.length !== 1) return null;
  return rows[0] ?? null;
}
