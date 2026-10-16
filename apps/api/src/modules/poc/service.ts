import { v7 as uuidv7 } from "uuid";
import { acceptPocItem, DomainError, type ActorContext, type TenantId } from "@alaira/domain";
import { withTenantTx } from "../../db/pool.js";
import {
  countOutboxForItem,
  findPocItemById,
  insertOutboxEvent,
  savePocItem,
} from "./repository.js";

export async function getPocItemForActor(
  actor: ActorContext,
  itemId: string,
  options: { applyAppTenantFilter: boolean },
): Promise<{ id: string; title: string; status: string }> {
  return withTenantTx(actor.tenantId, async (client) => {
    const item = await findPocItemById(
      client,
      itemId,
      options.applyAppTenantFilter,
      actor.tenantId,
    );
    if (!item) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return { id: item.id, title: item.title, status: item.status };
  });
}

export async function acceptPocItemCommand(
  actor: ActorContext,
  itemId: string,
  idempotencyKey: string,
): Promise<{ id: string; status: string }> {
  return withTenantTx(actor.tenantId, async (client) => {
    const existing = await client.query<{ outbox_event_id: string | null }>(
      `SELECT outbox_event_id FROM idempotency_record WHERE tenant_id = $1 AND idempotency_key = $2`,
      [actor.tenantId, idempotencyKey],
    );
    if (existing.rows[0]) {
      const item = await findPocItemById(client, itemId, true, actor.tenantId);
      if (!item) throw new DomainError("NOT_FOUND", "Resource not found");
      return { id: item.id, status: item.status };
    }

    const item = await findPocItemById(client, itemId, true, actor.tenantId);
    if (!item) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const { item: next, domainEvent } = acceptPocItem(item, actor);
    await savePocItem(client, next);

    const outboxId = uuidv7();
    await insertOutboxEvent(client, actor.tenantId, domainEvent.type, {
      itemId: domainEvent.itemId,
      idempotencyKey,
    }, outboxId);

    await client.query(
      `INSERT INTO idempotency_record (tenant_id, idempotency_key, command_name, outbox_event_id)
       VALUES ($1, $2, 'accept_poc_item', $3)`,
      [actor.tenantId, idempotencyKey, outboxId],
    );

    return { id: next.id, status: next.status };
  });
}

export async function countOutboxEventsForAcceptance(
  tenantId: TenantId,
  itemId: string,
): Promise<number> {
  return withTenantTx(tenantId, async (client) => countOutboxForItem(client, tenantId, itemId));
}
