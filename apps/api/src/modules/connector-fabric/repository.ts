import type pg from "pg";
import type { ConnectorHealthStatus } from "@alaira/contracts/connector-fabric";
import type { EncryptedSecret } from "@alaira/connectors/fabric";

type DbClient = pg.Client | pg.PoolClient;

export type ConnectionRow = {
  id: string;
  tenant_id: string;
  provider: string;
  display_name: string;
  health_status: ConnectorHealthStatus;
  last_successful_sync_at: string | null;
  lag_seconds: number | null;
  health_message: string | null;
};

export async function findConnectionById(
  client: pg.PoolClient,
  tenantId: string,
  connectionId: string,
): Promise<ConnectionRow | null> {
  const { rows } = await client.query<ConnectionRow>(
    `SELECT id, tenant_id, provider, display_name, health_status,
            last_successful_sync_at, lag_seconds, health_message
     FROM connector_connection WHERE tenant_id = $1 AND id = $2`,
    [tenantId, connectionId],
  );
  return rows[0] ?? null;
}

export async function findConnectionMetaAdmin(
  client: DbClient,
  connectionId: string,
): Promise<ConnectionRow | null> {
  const { rows } = await client.query<ConnectionRow>(
    `SELECT id, tenant_id, provider, display_name, health_status,
            last_successful_sync_at, lag_seconds, health_message
     FROM connector_connection WHERE id = $1`,
    [connectionId],
  );
  return rows[0] ?? null;
}

export async function findWebhookSigningSecret(
  client: pg.PoolClient,
  tenantId: string,
  connectionId: string,
): Promise<EncryptedSecret | null> {
  const { rows } = await client.query<{
    ciphertext: Buffer;
    iv: Buffer;
    tag: Buffer;
    key_id: string;
  }>(
    `SELECT ciphertext, iv, tag, key_id FROM connector_token_ciphertext
     WHERE tenant_id = $1 AND connection_id = $2 AND kind = 'webhook_signing'`,
    [tenantId, connectionId],
  );
  const row = rows[0];
  if (!row) return null;
  return { ciphertext: row.ciphertext, iv: row.iv, tag: row.tag, keyId: row.key_id };
}

export async function insertWebhookReceipt(
  client: pg.PoolClient,
  input: {
    id: string;
    tenantId: string;
    connectionId: string;
    provider: string;
    deliveryId: string;
    eventId: string;
    resourceId: string;
    dedupKey: string;
    payloadHash: string;
    status: "accepted" | "duplicate" | "rejected";
    rejectReason?: string;
  },
): Promise<boolean> {
  try {
    await client.query(
      `INSERT INTO connector_webhook_receipt (
         id, tenant_id, connection_id, provider, delivery_id, event_id,
         resource_id, dedup_key, payload_hash, status, reject_reason
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        input.id,
        input.tenantId,
        input.connectionId,
        input.provider,
        input.deliveryId,
        input.eventId,
        input.resourceId,
        input.dedupKey,
        input.payloadHash,
        input.status,
        input.rejectReason ?? null,
      ],
    );
    return true;
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") return false;
    throw e;
  }
}

export async function findReceiptByDedupKey(
  client: pg.PoolClient,
  tenantId: string,
  connectionId: string,
  dedupKey: string,
): Promise<{ id: string; status: string } | null> {
  const { rows } = await client.query<{ id: string; status: string }>(
    `SELECT id, status FROM connector_webhook_receipt
     WHERE tenant_id = $1 AND connection_id = $2 AND dedup_key = $3
       AND status IN ('accepted', 'duplicate') LIMIT 1`,
    [tenantId, connectionId, dedupKey],
  );
  return rows[0] ?? null;
}

export async function insertFabricOutbox(
  client: pg.PoolClient,
  input: {
    id: string;
    tenantId: string;
    connectionId: string;
    receiptId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO connector_fabric_outbox (id, tenant_id, connection_id, receipt_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [input.id, input.tenantId, input.connectionId, input.receiptId, JSON.stringify(input.payload)],
  );
}

export async function upsertTokenCiphertext(
  client: pg.PoolClient,
  tenantId: string,
  connectionId: string,
  kind: "oauth_access" | "oauth_refresh" | "webhook_signing",
  blob: EncryptedSecret,
): Promise<void> {
  await client.query(
    `INSERT INTO connector_token_ciphertext (
       connection_id, tenant_id, kind, ciphertext, iv, tag, key_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (connection_id, kind) DO UPDATE SET
       ciphertext = EXCLUDED.ciphertext, iv = EXCLUDED.iv,
       tag = EXCLUDED.tag, key_id = EXCLUDED.key_id`,
    [connectionId, tenantId, kind, blob.ciphertext, blob.iv, blob.tag, blob.keyId],
  );
}

export async function countOutboxForReceipt(
  client: pg.PoolClient,
  tenantId: string,
  receiptId: string,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM connector_fabric_outbox
     WHERE tenant_id = $1 AND receipt_id = $2`,
    [tenantId, receiptId],
  );
  return Number(rows[0]?.count ?? 0);
}
