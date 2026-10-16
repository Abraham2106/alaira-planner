import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  encryptSecret,
  resolveFabricMasterKey,
  signWebhookPayload,
  SYNTHETIC_WEBHOOK_SECRET,
} from "@alaira/connectors/fabric";
import {
  GITHUB_PROVIDER,
  SYNTHETIC_GITHUB_REPO,
  syntheticPullRequestMerged,
} from "@alaira/connectors/github";
import { parseProjectExternalId } from "@alaira/domain/project";
import { tick as connectorFabricWorkerTick } from "@alaira/worker/jobs/connector-fabric";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { appPool } from "../../db/pool.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0120!";
const tenantSlug = `synth-github-${Date.now()}`;
const baseCriteria = [{ key: "pr_merged", text: "PR mergeado", required: true }];

const hybridProfile = {
  planningMode: "hybrid" as const,
  scheduleEngine: true,
  agileExecution: true,
  financialControl: "full" as const,
  resourcePlanning: true,
  baselineRequired: true,
};

function cookieHeaderFromSetCookie(setCookie: string | string[] | undefined): string {
  if (!setCookie) return "";
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  return parts
    .map((part) => part.split(";")[0]?.trim())
    .filter((part): part is string => Boolean(part))
    .join("; ");
}

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

describe.skipIf(!dbUp)("TASK-0120 github connector (80/20)", () => {
  let cookies: string;
  let csrf: string;
  let tenantId: string;
  let projectExternalId: string;
  let workNodeExternalId: string;
  let connectionId: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    const app = await buildServer();
    const ownerEmail = `gh-owner-${Date.now()}@synth.test`;
    await app.inject({
      method: "POST",
      url: "/api/v1/iam/tenants/register",
      payload: {
        organizationName: "GitHub Synth Org",
        slug: tenantSlug,
        ownerEmail,
        ownerDisplayName: "GH Owner",
        password: synthPassword,
      },
    });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: ownerEmail, password: synthPassword },
    });
    expect(login.statusCode).toBe(200);
    const body = login.json() as { csrfToken: string };
    cookies = cookieHeaderFromSetCookie(login.headers["set-cookie"]);
    csrf = body.csrfToken;

    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    const tenantRow = await admin.query<{ id: string }>(
      `SELECT id::text FROM tenant WHERE slug = $1`,
      [tenantSlug],
    );
    tenantId = tenantRow.rows[0]!.id;
    connectionId = randomUUID();
    const blob = encryptSecret(SYNTHETIC_WEBHOOK_SECRET, resolveFabricMasterKey());
    await admin.query(
      `INSERT INTO connector_connection (id, tenant_id, provider, display_name, health_status)
       VALUES ($1, $2, $3, 'GitHub Synthetic', 'disconnected')
       ON CONFLICT (id) DO UPDATE SET provider = EXCLUDED.provider`,
      [connectionId, tenantId, GITHUB_PROVIDER],
    );
    await admin.query(
      `INSERT INTO connector_token_ciphertext (
         connection_id, tenant_id, kind, ciphertext, iv, tag, key_id
       ) VALUES ($1, $2, 'webhook_signing', $3, $4, $5, $6)
       ON CONFLICT (connection_id, kind) DO UPDATE SET
         ciphertext = EXCLUDED.ciphertext, iv = EXCLUDED.iv, tag = EXCLUDED.tag`,
      [connectionId, tenantId, blob.ciphertext, blob.iv, blob.tag, blob.keyId],
    );
    await admin.end();

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: cookies, "x-alaira-csrf": csrf },
      payload: { name: "GitHub Evidence", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectExternalId = (create.json() as { id: string }).id;

    const pkg = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectExternalId}/wbs/packages`,
      headers: { cookie: cookies, "x-alaira-csrf": csrf },
      payload: { wbsCode: "1.1", title: "PR merge target", criteria: baseCriteria },
    });
    expect(pkg.statusCode).toBe(201);
    workNodeExternalId = (pkg.json() as { id: string }).id;

    const config = await app.inject({
      method: "PUT",
      url: `/api/v1/github-connector/connections/${connectionId}/config`,
      headers: { cookie: cookies, "x-alaira-csrf": csrf },
      payload: { projectId: projectExternalId, repositoryFullName: SYNTHETIC_GITHUB_REPO },
    });
    expect(config.statusCode).toBe(204);

    const link = await app.inject({
      method: "POST",
      url: `/api/v1/github-connector/connections/${connectionId}/issue-links`,
      headers: { cookie: cookies, "x-alaira-csrf": csrf },
      payload: {
        projectId: projectExternalId,
        repositoryFullName: SYNTHETIC_GITHUB_REPO,
        issueNumber: 7,
        workNodeId: workNodeExternalId,
      },
    });
    expect(link.statusCode).toBe(204);
    await app.close();
  });

  afterAll(async () => {
    await appPool.end();
  });

  function signedWebhookBody(suffix: string) {
    const ghPayload = syntheticPullRequestMerged(suffix, { issueNumber: 7 });
    const body = {
      provider: GITHUB_PROVIDER,
      eventId: `gh-ev-${suffix}`,
      deliveryId: `gh-del-${suffix}`,
      resourceId: `${SYNTHETIC_GITHUB_REPO}/pull/42`,
      payload: ghPayload,
    };
    const raw = JSON.stringify(body);
    const ts = Math.floor(Date.now() / 1000);
    return {
      body,
      headers: {
        "content-type": "application/json",
        "x-alaira-timestamp": String(ts),
        "x-alaira-signature": signWebhookPayload(SYNTHETIC_WEBHOOK_SECRET, ts, raw),
        "x-alaira-delivery-id": body.deliveryId,
      },
    };
  }

  it("TC-GH-01: merged PR via fabric → single EvidenceEvent linked to work item", async () => {
    const app = await buildServer();
    const suffix = String(Date.now());
    const { body, headers } = signedWebhookBody(suffix);
    const webhookUrl = `/api/v1/connector-fabric/webhooks/${connectionId}`;

    const first = await app.inject({ method: "POST", url: webhookUrl, payload: body, headers });
    expect(first.statusCode).toBe(202);
    const dup = await app.inject({ method: "POST", url: webhookUrl, payload: body, headers });
    expect(dup.statusCode).toBe(200);

    await connectorFabricWorkerTick();

    const process = await app.inject({
      method: "POST",
      url: `/api/v1/github-connector/connections/${connectionId}/process-dispatches`,
      headers: { cookie: cookies, "x-alaira-csrf": csrf },
    });
    expect(process.statusCode).toBe(200);
    const { processed, evidenceEventIds } = process.json() as {
      processed: number;
      evidenceEventIds: string[];
    };
    expect(processed).toBe(1);
    expect(evidenceEventIds.length).toBe(1);

    const projectUuid = parseProjectExternalId(projectExternalId, "project");
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    try {
      const events = await admin.query<{ count: string; work_item: string | null }>(
        `SELECT count(*)::text AS count,
                max(work_item_candidate::text) AS work_item
         FROM evidence_event
         WHERE tenant_id = $1 AND project_id = $2 AND dedupe_key = $3`,
        [tenantId, projectUuid, `github:pr-42-merged:gh-del-${suffix}`],
      );
      expect(Number(events.rows[0]?.count ?? 0)).toBe(1);
      const workNodeUuid = parseProjectExternalId(workNodeExternalId, "workNode");
      expect(events.rows[0]?.work_item).toBe(workNodeUuid);
    } finally {
      await admin.end();
    }

    const reprocess = await app.inject({
      method: "POST",
      url: `/api/v1/github-connector/connections/${connectionId}/process-dispatches`,
      headers: { cookie: cookies, "x-alaira-csrf": csrf },
    });
    expect((reprocess.json() as { processed: number }).processed).toBe(0);
    await app.close();
  });

  it("forged webhook (no fabric HMAC) → no evidence row", async () => {
    const app = await buildServer();
    const suffix = `forged-${Date.now()}`;
    const ghPayload = syntheticPullRequestMerged(suffix, { issueNumber: 7 });
    const body = {
      provider: GITHUB_PROVIDER,
      eventId: `gh-ev-${suffix}`,
      deliveryId: `gh-del-${suffix}`,
      resourceId: `${SYNTHETIC_GITHUB_REPO}/pull/42`,
      payload: ghPayload,
    };
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/connector-fabric/webhooks/${connectionId}`,
      payload: body,
      headers: {
        "content-type": "application/json",
        "x-alaira-timestamp": String(Math.floor(Date.now() / 1000)),
        "x-alaira-signature": "sha256=forged",
      },
    });
    expect(res.statusCode).toBe(401);

    const projectUuid = parseProjectExternalId(projectExternalId, "project");
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    try {
      const events = await admin.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM evidence_event
         WHERE tenant_id = $1 AND project_id = $2 AND dedupe_key LIKE $3`,
        [tenantId, projectUuid, `%gh-del-${suffix}%`],
      );
      expect(Number(events.rows[0]?.count ?? 0)).toBe(0);
    } finally {
      await admin.end();
    }
    await app.close();
  });
});
