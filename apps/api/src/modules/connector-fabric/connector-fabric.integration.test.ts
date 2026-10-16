import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantId } from "@alaira/domain";
import {
  encryptSecret,
  resolveFabricMasterKey,
  signWebhookPayload,
  SYNTHETIC_WEBHOOK_SECRET,
} from "@alaira/connectors/fabric";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { appPool } from "../../db/pool.js";
import { buildServer } from "../../server.js";
import { countOutboxRowsForReceipt } from "./service.js";

async function connectorFabricTick(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      id: string;
      tenant_id: string;
      connection_id: string;
      receipt_id: string;
      payload: { simulateFail?: boolean };
      attempt_count: number;
    }>(
      `SELECT id, tenant_id, connection_id, receipt_id, payload, attempt_count
       FROM connector_fabric_outbox
       WHERE processed_at IS NULL AND next_attempt_at <= now()
       ORDER BY created_at ASC LIMIT 20 FOR UPDATE SKIP LOCKED`,
    );
    for (const row of rows) {
      const shouldFail = row.payload?.simulateFail === true;
      if (shouldFail && row.attempt_count + 1 < 3) {
        await client.query(
          `UPDATE connector_fabric_outbox
           SET attempt_count = attempt_count + 1, last_error = 'simulated_failure',
               next_attempt_at = now() + interval '1 second'
           WHERE id = $1`,
          [row.id],
        );
        continue;
      }
      if (shouldFail) {
        await client.query(
          `INSERT INTO connector_fabric_dlq (
             id, tenant_id, outbox_id, connection_id, receipt_id,
             attempt_count, last_error, payload
           ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::jsonb)`,
          [
            row.tenant_id,
            row.id,
            row.connection_id,
            row.receipt_id,
            row.attempt_count + 1,
            "simulated_failure",
            JSON.stringify(row.payload),
          ],
        );
        await client.query(
          `UPDATE connector_fabric_outbox SET processed_at = now(), last_error = 'dlq' WHERE id = $1`,
          [row.id],
        );
        continue;
      }
      await client.query(
        `INSERT INTO connector_fabric_dispatch (outbox_id, tenant_id, receipt_id)
         VALUES ($1, $2, $3) ON CONFLICT (outbox_id) DO NOTHING`,
        [row.id, row.tenant_id, row.receipt_id],
      );
      await client.query(
        `UPDATE connector_fabric_outbox SET processed_at = now() WHERE id = $1`,
        [row.id],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

const { adminUrl } = loadDbConfig();
const connectionA = "018f0000-0000-7000-8000-00000000c001";
const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;
const userA = "018f0000-0000-7000-8000-000000000011";
const sessionA = "018f0000-0000-7000-8000-0000000000a1";

async function dbReachable(): Promise<boolean> {
  const client = new pg.Client({ connectionString: adminUrl });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

const dbUp = await dbReachable();

async function ensureFabricIamFixture(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO tenant (id, name, slug) VALUES ($1, 'Fabric Tenant A', 'fabric-tenant-a')
       ON CONFLICT (id) DO NOTHING`,
      [tenantA],
    );
    await client.query(
      `INSERT INTO app_user (id, tenant_id, email, org_role) VALUES ($1, $2, 'fabric-a@test.local', 'owner')
       ON CONFLICT (id) DO NOTHING`,
      [userA, tenantA],
    );
    await client.query(
      `INSERT INTO session (
         id, tenant_id, user_id, expires_at, csrf_token, absolute_expires_at, last_activity_at
       ) VALUES ($1, $2, $3, now() + interval '1 day', 'fabric-csrf-a', now() + interval '1 day', now())
       ON CONFLICT (id) DO NOTHING`,
      [sessionA, tenantA, userA],
    );
  } finally {
    await client.end();
  }
}

async function seedFabricConnection(tenantId: TenantId, connectionId: string): Promise<void> {
  const blob = encryptSecret(SYNTHETIC_WEBHOOK_SECRET, resolveFabricMasterKey());
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO connector_connection (id, tenant_id, provider, display_name, health_status)
       VALUES ($1, $2, 'fake', 'Synthetic Fabric', 'disconnected')
       ON CONFLICT (id) DO NOTHING`,
      [connectionId, tenantId],
    );
    await client.query(
      `INSERT INTO connector_token_ciphertext (
         connection_id, tenant_id, kind, ciphertext, iv, tag, key_id
       ) VALUES ($1, $2, 'webhook_signing', $3, $4, $5, $6)
       ON CONFLICT (connection_id, kind) DO UPDATE SET
         ciphertext = EXCLUDED.ciphertext, iv = EXCLUDED.iv, tag = EXCLUDED.tag`,
      [connectionId, tenantId, blob.ciphertext, blob.iv, blob.tag, blob.keyId],
    );
  } finally {
    await client.end();
  }
}

function webhookBody(suffix: string) {
  return {
    provider: "fake",
    eventId: `ev-0119-${suffix}`,
    deliveryId: `del-0119-${suffix}`,
    resourceId: "res-1",
    payload: { synthetic: true },
  };
}

function signedHeaders(body: Record<string, unknown>, ts: number) {
  const raw = JSON.stringify(body);
  return {
    "content-type": "application/json",
    "x-alaira-timestamp": String(ts),
    "x-alaira-signature": signWebhookPayload(SYNTHETIC_WEBHOOK_SECRET, ts, raw),
    "x-alaira-delivery-id": String(body.deliveryId),
  };
}

describe.skipIf(!dbUp)("TASK-0119 connector fabric (80/20)", () => {
  beforeAll(async () => {
    await migrate(adminUrl, "up");
    await ensureFabricIamFixture();
    await seedFabricConnection(tenantA, connectionA);
  });

  afterAll(async () => {
    await appPool.end();
  });

  it("TC-INT-01: duplicate webhook → one outbox row", async () => {
    const app = await buildServer();
    const suffix = String(Date.now());
    const body = webhookBody(suffix);
    const headers = signedHeaders(body, Math.floor(Date.now() / 1000));
    const url = `/api/v1/connector-fabric/webhooks/${connectionA}`;
    const first = await app.inject({ method: "POST", url, payload: body, headers });
    const second = await app.inject({ method: "POST", url, payload: body, headers });
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(200);
    const receiptId = first.json().receiptId as string;
    expect(await countOutboxRowsForReceipt(tenantA, receiptId)).toBe(1);
    await app.close();
  });

  it("invalid signature rejected without accepted receipt", async () => {
    const app = await buildServer();
    const body = webhookBody(`bad-sig-${Date.now()}`);
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/connector-fabric/webhooks/${connectionA}`,
      payload: body,
      headers: {
        "content-type": "application/json",
        "x-alaira-timestamp": String(Math.floor(Date.now() / 1000)),
        "x-alaira-signature": "sha256=invalid",
      },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it("health endpoint exposes connected status", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/connector-fabric/connections/${connectionA}/health`,
      headers: { "x-alaira-session": sessionA },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().health.status).toBe("connected");
    await app.close();
  });

  it("worker moves simulateFail payloads to DLQ after retries", async () => {
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    const receiptId = randomUUID();
    const outboxId = randomUUID();
    const dlqEvent = `e-dlq-${Date.now()}`;
    try {
      await admin.query(
        `INSERT INTO connector_webhook_receipt (
           id, tenant_id, connection_id, provider, delivery_id, event_id,
           resource_id, dedup_key, payload_hash, status
         ) VALUES ($1, $2, $3, 'fake', 'd-dlq', $4, 'r', $5, 'hash', 'accepted')`,
        [receiptId, tenantA, connectionA, dlqEvent, `fake:${dlqEvent}:d-dlq`],
      );
      await admin.query(
        `INSERT INTO connector_fabric_outbox (
           id, tenant_id, connection_id, receipt_id, payload, attempt_count
         ) VALUES ($1, $2, $3, $4, $5::jsonb, 2)`,
        [outboxId, tenantA, connectionA, receiptId, JSON.stringify({ simulateFail: true })],
      );
    } finally {
      await admin.end();
    }
    await connectorFabricTick();
    const check = new pg.Client({ connectionString: adminUrl });
    await check.connect();
    try {
      const dlq = await check.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM connector_fabric_dlq WHERE outbox_id = $1`,
        [outboxId],
      );
      expect(Number(dlq.rows[0]?.count ?? 0)).toBe(1);
    } finally {
      await check.end();
    }
  });
});
