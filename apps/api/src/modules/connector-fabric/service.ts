import { v7 as uuidv7 } from "uuid";
import pg from "pg";
import { DomainError, type TenantId } from "@alaira/domain";
import type { WebhookIngestBody } from "@alaira/contracts/connector-fabric";
import {
  buildWebhookDedupKey,
  decryptSecret,
  encryptSecret,
  hashWebhookPayload,
  redactForLog,
  resolveFabricMasterKey,
  verifyWebhookSignature,
} from "@alaira/connectors/fabric";
import { toExternalId } from "@alaira/domain/iam";
import { loadDbConfig } from "../../db/config.js";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { policyEnforceCommand } from "../authz/service.js";
import {
  countOutboxForReceipt,
  findConnectionById,
  findConnectionMetaAdmin,
  findReceiptByDedupKey,
  findWebhookSigningSecret,
  insertFabricOutbox,
  insertWebhookReceipt,
  upsertTokenCiphertext,
} from "./repository.js";

const { adminUrl } = loadDbConfig();

export class WebhookRejectedError extends Error {
  readonly code: "invalid_signature" | "replay" | "not_found";

  constructor(code: WebhookRejectedError["code"], message: string) {
    super(message);
    this.name = "WebhookRejectedError";
    this.code = code;
  }
}

async function withAdminClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function ingestWebhookCommand(
  connectionId: string,
  rawBody: string,
  headers: { timestamp?: string; signature?: string; deliveryId?: string },
  body: WebhookIngestBody,
): Promise<{ receiptId: string; status: "accepted" | "duplicate"; dedupKey: string }> {
  const meta = await withAdminClient((client) => findConnectionMetaAdmin(client, connectionId));
  if (!meta) throw new WebhookRejectedError("not_found", "Connection not found");
  if (meta.health_status === "revoked") {
    throw new WebhookRejectedError("invalid_signature", "Connection revoked");
  }

  const tenantId = meta.tenant_id as TenantId;
  const signingBlob = await withTenantTx(tenantId, (client) =>
    findWebhookSigningSecret(client, tenantId, connectionId),
  );
  if (!signingBlob) {
    throw new WebhookRejectedError("invalid_signature", "Signing secret not configured");
  }

  const verified = verifyWebhookSignature({
    signingSecret: decryptSecret(signingBlob, resolveFabricMasterKey()),
    rawBody,
    timestampHeader: headers.timestamp ?? "",
    signatureHeader: headers.signature ?? "",
  });
  if (!verified.ok) {
    throw new WebhookRejectedError("invalid_signature", verified.reason);
  }

  const deliveryId = headers.deliveryId ?? body.deliveryId;
  const dedupKey = buildWebhookDedupKey({
    provider: body.provider,
    eventId: body.eventId,
    deliveryId,
  });

  const existing = await withTenantTx(tenantId, (client) =>
    findReceiptByDedupKey(client, tenantId, connectionId, dedupKey),
  );
  if (existing) {
    return { receiptId: existing.id, status: "duplicate", dedupKey };
  }

  const receiptId = uuidv7();
  const outboxId = uuidv7();
  const payloadHash = hashWebhookPayload(body.payload);

  return withTenantTx(tenantId, async (client) => {
    const inserted = await insertWebhookReceipt(client, {
      id: receiptId,
      tenantId,
      connectionId,
      provider: body.provider,
      deliveryId,
      eventId: body.eventId,
      resourceId: body.resourceId,
      dedupKey,
      payloadHash,
      status: "accepted",
    });
    if (!inserted) {
      const dup = await findReceiptByDedupKey(client, tenantId, connectionId, dedupKey);
      if (dup) return { receiptId: dup.id, status: "duplicate" as const, dedupKey };
      throw new DomainError("CONFLICT", "Concurrent webhook ingest");
    }

    await insertFabricOutbox(client, {
      id: outboxId,
      tenantId,
      connectionId,
      receiptId,
      payload: {
        provider: body.provider,
        eventId: body.eventId,
        deliveryId,
        resourceId: body.resourceId,
        payloadHash,
        normalized: body.payload,
      },
    });

    await client.query(
      `UPDATE connector_connection
       SET health_status = 'connected', last_successful_sync_at = now(),
           lag_seconds = 0, updated_at = now()
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, connectionId],
    );

    return { receiptId, status: "accepted" as const, dedupKey };
  });
}

export async function getConnectionHealthCommand(
  session: IamSession,
  connectionId: string,
): Promise<{
  connectionId: string;
  provider: string;
  displayName: string;
  health: {
    status: string;
    lastSuccessfulSyncAt: string | null;
    lagSeconds: number | null;
    message?: string;
  };
}> {
  await policyEnforceCommand(session, "org:read", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });

  return withTenantTx(session.tenantId, async (client) => {
    const row = await findConnectionById(client, session.tenantId, connectionId);
    if (!row) throw new DomainError("NOT_FOUND", "Resource not found");
    return {
      connectionId: row.id,
      provider: row.provider,
      displayName: row.display_name,
      health: {
        status: row.health_status,
        lastSuccessfulSyncAt: row.last_successful_sync_at
          ? new Date(row.last_successful_sync_at).toISOString()
          : null,
        lagSeconds: row.lag_seconds,
        ...(row.health_message ? { message: row.health_message } : {}),
      },
    };
  });
}

export async function storeSyntheticTokenCommand(
  session: IamSession,
  connectionId: string,
  kind: "oauth_access" | "oauth_refresh" | "webhook_signing",
  plaintext: string,
): Promise<void> {
  await policyEnforceCommand(session, "org:manage_members", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });
  const blob = encryptSecret(plaintext, resolveFabricMasterKey());
  await withTenantTx(session.tenantId, async (client) => {
    const row = await findConnectionById(client, session.tenantId, connectionId);
    if (!row) throw new DomainError("NOT_FOUND", "Resource not found");
    await upsertTokenCiphertext(client, session.tenantId, connectionId, kind, blob);
  });
}

export function safeWebhookLogContext(context: Record<string, unknown>): Record<string, unknown> {
  return redactForLog(context) as Record<string, unknown>;
}

export async function countOutboxRowsForReceipt(
  tenantId: TenantId,
  receiptId: string,
): Promise<number> {
  return withTenantTx(tenantId, (client) => countOutboxForReceipt(client, tenantId, receiptId));
}
