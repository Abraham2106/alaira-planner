import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantId } from "@alaira/domain";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { appPool } from "../../db/pool.js";
import { buildServer } from "../../server.js";
import { seedPocSyntheticTenants } from "../../bootstrap/poc-test-seed.js";
import {
  appendProjectEventLogCommand,
  countEventlogOutboxForKey,
  countProjectAuditEvents,
} from "./service.js";

const { adminUrl } = loadDbConfig();
const EVENTLOG_OUTBOX_EVENT_TYPE = "eventlog.audit_event.recorded";

async function dispatchEventlogOutbox(): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      id: string;
      tenant_id: string;
      payload: { auditEventId?: string };
    }>(
      `SELECT id, tenant_id, payload FROM outbox_event
       WHERE event_type = $1 AND processed_at IS NULL
       ORDER BY created_at ASC LIMIT 20 FOR UPDATE SKIP LOCKED`,
      [EVENTLOG_OUTBOX_EVENT_TYPE],
    );
    for (const row of rows) {
      const auditEventId = row.payload?.auditEventId;
      if (!auditEventId) continue;
      await client.query(
        `INSERT INTO eventlog_outbox_dispatch (outbox_event_id, tenant_id, audit_event_id)
         VALUES ($1, $2, $3) ON CONFLICT (outbox_event_id) DO NOTHING`,
        [row.id, row.tenant_id, auditEventId],
      );
      await client.query(
        `UPDATE outbox_event SET processed_at = now() WHERE id = $1 AND processed_at IS NULL`,
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

const projectA = "018f0000-0000-7000-8000-00000000a001";
const projectB = "018f0000-0000-7000-8000-00000000b001";

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

async function seedEventlogProjects(
  seed: Awaited<ReturnType<typeof seedPocSyntheticTenants>>,
): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO eventlog_project (tenant_id, project_id, name) VALUES
         ($1, $3, 'Synthetic Project A'),
         ($2, $4, 'Synthetic Project B')`,
      [seed.tenantA, seed.tenantB, projectA, projectB],
    );
  } finally {
    await client.end();
  }
}

function sessionFor(seed: Awaited<ReturnType<typeof seedPocSyntheticTenants>>, which: "A" | "B") {
  return {
    sessionId: which === "A" ? seed.sessionA : seed.sessionB,
    tenantId: (which === "A" ? seed.tenantA : seed.tenantB) as TenantId,
    userId: which === "A" ? "018f0000-0000-7000-8000-000000000011" : "018f0000-0000-7000-8000-000000000022",
    csrfToken: which === "A" ? "poc-csrf-a" : "poc-csrf-b",
  };
}

describe.skipIf(!dbUp)("TASK-0109 event log (80/20)", () => {
  let seed: Awaited<ReturnType<typeof seedPocSyntheticTenants>>;

  beforeAll(async () => {
    await migrate(adminUrl, "down");
    await migrate(adminUrl, "up");
    seed = await seedPocSyntheticTenants(adminUrl);
    await seedEventlogProjects(seed);
  });

  afterAll(async () => {
    await appPool.end();
  });

  it("TC-INT-01: same idempotency key → one audit row and one outbox row", async () => {
    const session = sessionFor(seed, "A");
    const key = "idem-eventlog-0109-append";
    const body = {
      eventType: "evidence.linked",
      summary: "PR #42 linked to deliverable A",
      evidenceRef: "github:pr/42",
      effect: "proposal_queued",
    };
    await appendProjectEventLogCommand(session, projectA, key, body);
    await appendProjectEventLogCommand(session, projectA, key, body);
    expect(await countProjectAuditEvents(seed.tenantA, projectA)).toBe(1);
    expect(await countEventlogOutboxForKey(seed.tenantA, key)).toBe(1);
  });

  it("append-only: alaira_app cannot UPDATE audit rows", async () => {
    const client = await appPool.connect();
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [seed.tenantA]);
      await expect(
        client.query(
          `UPDATE project_audit_event SET summary = 'tampered' WHERE tenant_id = $1 AND project_id = $2`,
          [seed.tenantA, projectA],
        ),
      ).rejects.toThrow(/permission denied/i);
    } finally {
      client.release();
    }
  });

  it("outbox dispatch is idempotent under worker tick", async () => {
    const session = sessionFor(seed, "A");
    const key = "idem-eventlog-0109-dispatch";
    await appendProjectEventLogCommand(session, projectA, key, {
      eventType: "schedule.recalculated",
      summary: "Schedule recalculated after acceptance",
      effect: "critical_path_updated",
    });
    await dispatchEventlogOutbox();
    await dispatchEventlogOutbox();

    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    try {
      const { rows } = await admin.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM eventlog_outbox_dispatch
         WHERE tenant_id = $1`,
        [seed.tenantA],
      );
      expect(Number(rows[0]?.count ?? 0)).toBeGreaterThanOrEqual(2);
      const dup = await admin.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM (
           SELECT outbox_event_id FROM eventlog_outbox_dispatch GROUP BY outbox_event_id HAVING count(*) > 1
         ) d`,
      );
      expect(Number(dup.rows[0]?.count ?? 0)).toBe(0);
    } finally {
      await admin.end();
    }
  });

  it("TC-SEC-01 style: cross-tenant project log is empty / not found", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectB}/event-log`,
      headers: { "x-alaira-session": seed.sessionA },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
