import type pg from "pg";
import type { PocItem, TenantId } from "@alaira/domain";

export async function findPocItemById(
  client: pg.PoolClient,
  itemId: string,
  /** When false, omits tenant_id predicate — RLS must still enforce isolation. */
  applyAppTenantFilter: boolean,
  tenantId?: TenantId,
): Promise<PocItem | null> {
  const sql = applyAppTenantFilter
    ? `SELECT id, tenant_id, title, status, version FROM poc_item WHERE id = $1 AND tenant_id = $2`
    : `SELECT id, tenant_id, title, status, version FROM poc_item WHERE id = $1`;
  const params = applyAppTenantFilter ? [itemId, tenantId] : [itemId];
  const { rows } = await client.query<{
    id: string;
    tenant_id: string;
    title: string;
    status: "draft" | "accepted";
    version: number;
  }>(sql, params);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id as TenantId,
    title: row.title,
    status: row.status,
    version: row.version,
  };
}

export async function savePocItem(client: pg.PoolClient, item: PocItem): Promise<void> {
  await client.query(
    `UPDATE poc_item SET status = $2, version = $3 WHERE id = $1 AND tenant_id = $4`,
    [item.id, item.status, item.version, item.tenantId],
  );
}

export async function insertOutboxEvent(
  client: pg.PoolClient,
  tenantId: TenantId,
  eventType: string,
  payload: Record<string, unknown>,
  eventId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO outbox_event (id, tenant_id, event_type, payload) VALUES ($1, $2, $3, $4)`,
    [eventId, tenantId, eventType, payload],
  );
}

export async function countOutboxForItem(
  client: pg.PoolClient,
  tenantId: TenantId,
  itemId: string,
): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM outbox_event
     WHERE tenant_id = $1 AND payload->>'itemId' = $2`,
    [tenantId, itemId],
  );
  return Number(rows[0]?.count ?? 0);
}
