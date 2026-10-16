import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantId } from "@alaira/domain";
import { parseExternalId } from "@alaira/domain/iam";
import { parseProjectExternalId } from "@alaira/domain/project";
import {
  encryptSecret,
  resolveFabricMasterKey,
  signWebhookPayload,
  SYNTHETIC_WEBHOOK_SECRET,
} from "@alaira/connectors/fabric";
import {
  SYNTHETIC_SLACK_USER_GUEST,
  SYNTHETIC_SLACK_USER_LINKED,
  syntheticSlackWebhookBody,
} from "@alaira/connectors/slack";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { appPool } from "../../db/pool.js";
import { buildServer } from "../../server.js";
import { countPendingForDedup } from "./service.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0121!";
const tenantSlug = `synth-slack-${Date.now()}`;
const connectionSlack = "018f0000-0000-7000-8000-00000000d121";

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

function signedHeaders(body: Record<string, unknown>, ts: number) {
  const raw = JSON.stringify(body);
  return {
    "content-type": "application/json",
    "x-alaira-timestamp": String(ts),
    "x-alaira-signature": signWebhookPayload(SYNTHETIC_WEBHOOK_SECRET, ts, raw),
    "x-alaira-delivery-id": String(body.deliveryId),
  };
}

async function seedSlackConnection(tenantId: TenantId): Promise<void> {
  const blob = encryptSecret(SYNTHETIC_WEBHOOK_SECRET, resolveFabricMasterKey());
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO connector_connection (id, tenant_id, provider, display_name, health_status)
       VALUES ($1, $2, 'slack', 'Synthetic Slack', 'connected')
       ON CONFLICT (id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         provider = 'slack',
         health_status = 'connected'`,
      [connectionSlack, tenantId],
    );
    await client.query(
      `INSERT INTO connector_token_ciphertext (
         connection_id, tenant_id, kind, ciphertext, iv, tag, key_id
       ) VALUES ($1, $2, 'webhook_signing', $3, $4, $5, $6)
       ON CONFLICT (connection_id, kind) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         ciphertext = EXCLUDED.ciphertext, iv = EXCLUDED.iv, tag = EXCLUDED.tag`,
      [connectionSlack, tenantId, blob.ciphertext, blob.iv, blob.tag, blob.keyId],
    );
  } finally {
    await client.end();
  }
}

describe.skipIf(!dbUp)("TASK-0121 slack intake (80/20)", () => {
  let owner: {
    cookies: string;
    csrf: string;
    tenantId: TenantId;
    userId: string;
    userExternal: string;
  };
  let guestUserId: string;
  let projectId: string;
  const projectName = "Project Checkout";

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    const app = await buildServer();
    const ownerEmail = `owner-${Date.now()}@synth.test`;
    const guestEmail = `guest-${Date.now()}@synth.test`;

    await app.inject({
      method: "POST",
      url: "/api/v1/iam/tenants/register",
      payload: {
        organizationName: "Synthetic Slack Org",
        slug: tenantSlug,
        ownerEmail,
        ownerDisplayName: "Owner Slack",
        password: synthPassword,
      },
    });
    const ownerLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: ownerEmail, password: synthPassword },
    });
    expect(ownerLogin.statusCode).toBe(200);
    const ownerBody = ownerLogin.json() as {
      csrfToken: string;
      tenantId: string;
      userId: string;
    };
    const tenantUuid = parseExternalId(ownerBody.tenantId, "tenant") as TenantId;
    const ownerUuid = parseExternalId(ownerBody.userId, "user");
    if (!ownerUuid) throw new Error("owner uuid");
    owner = {
      cookies: cookieHeaderFromSetCookie(ownerLogin.headers["set-cookie"]),
      csrf: ownerBody.csrfToken,
      tenantId: tenantUuid,
      userId: ownerUuid,
      userExternal: ownerBody.userId,
    };

    const inviteRes = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { email: guestEmail },
    });
    expect(inviteRes.statusCode).toBe(201);
    const { acceptToken } = inviteRes.json() as { acceptToken: string };
    await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations/accept",
      payload: { acceptToken, password: synthPassword, displayName: "Guest Slack" },
    });
    const guestLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: guestEmail, password: synthPassword },
    });
    const guestExternal = (guestLogin.json() as { userId: string }).userId;
    guestUserId = parseExternalId(guestExternal, "user") ?? guestExternal;

    const demote = await app.inject({
      method: "PATCH",
      url: `/api/v1/authz/memberships/${guestExternal}/org-role`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { orgRole: "guest" },
    });
    expect(demote.statusCode).toBe(200);

    const proj = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        name: projectName,
        deliveryProfile: {
          planningMode: "hybrid",
          scheduleEngine: true,
          agileExecution: true,
          financialControl: "full",
          resourcePlanning: true,
          baselineRequired: true,
        },
      },
    });
    expect(proj.statusCode).toBe(201);
    const projectExternal = (proj.json() as { id: string }).id;
    projectId = parseProjectExternalId(projectExternal, "project") ?? projectExternal;

    await seedSlackConnection(owner.tenantId);

    const linkOwner = await app.inject({
      method: "POST",
      url: `/api/v1/slack-intake/connections/${connectionSlack}/identity-links`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { slackUserId: SYNTHETIC_SLACK_USER_LINKED, appUserId: owner.userId },
    });
    expect(linkOwner.statusCode).toBe(204);
    const linkGuest = await app.inject({
      method: "POST",
      url: `/api/v1/slack-intake/connections/${connectionSlack}/identity-links`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { slackUserId: SYNTHETIC_SLACK_USER_GUEST, appUserId: guestUserId },
    });
    expect(linkGuest.statusCode).toBe(204);

    await app.close();
  });

  afterAll(async () => {
    await appPool.end();
  });

  it("TC-INT-03: duplicate mention → one pending row, no state change on retry", async () => {
    const app = await buildServer();
    const suffix = `dup-${Date.now()}`;
    const body = syntheticSlackWebhookBody(
      suffix,
      "<@UBOT> mark API design complete in Project Checkout",
    );
    const headers = signedHeaders(body, Math.floor(Date.now() / 1000));
    const url = `/api/v1/slack-intake/connections/${connectionSlack}/mentions`;
    const first = await app.inject({ method: "POST", url, payload: body, headers });
    const second = await app.inject({ method: "POST", url, payload: body, headers });
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(200);
    const firstBody = first.json() as { outcome: string; pendingRequestId: string };
    const secondBody = second.json() as { outcome: string; pendingRequestId: string };
    expect(firstBody.outcome).toBe("pending_created");
    expect(secondBody.outcome).toBe("duplicate_no_state_change");
    expect(secondBody.pendingRequestId).toBe(firstBody.pendingRequestId);
    const norm = await import("@alaira/connectors/slack");
    const dedup = norm.normalizeSlackMention(body.eventId, body.deliveryId, body.payload).dedupKey;
    expect(await countPendingForDedup(owner.tenantId, connectionSlack, dedup)).toBe(1);
    await app.close();
  });

  it("TC-BOT-01 partial: ambiguous command does not create pending completion", async () => {
    const app = await buildServer();
    const suffix = `amb-${Date.now()}`;
    const body = syntheticSlackWebhookBody(
      suffix,
      "<@UBOT> mark something as complete",
      SYNTHETIC_SLACK_USER_LINKED,
    );
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/slack-intake/connections/${connectionSlack}/mentions`,
      payload: body,
      headers: signedHeaders(body, Math.floor(Date.now() / 1000)),
    });
    expect(res.statusCode).toBe(202);
    const json = res.json() as { outcome: string };
    expect(json.outcome).toBe("needs_disambiguation");
    const client = new pg.Client({ connectionString: adminUrl });
    await client.connect();
    const dedup = (
      await import("@alaira/connectors/slack")
    ).normalizeSlackMention(body.eventId, body.deliveryId, body.payload).dedupKey;
    const { rows } = await client.query<{ status: string }>(
      `SELECT status FROM slack_intake_pending_request
       WHERE tenant_id = $1 AND connection_id = $2 AND dedup_key = $3`,
      [owner.tenantId, connectionSlack, dedup],
    );
    await client.end();
    expect(rows[0]?.status).toBe("needs_disambiguation");
    await app.close();
  });

  it("guest-linked Slack user denied project:write (explicit rejection)", async () => {
    const app = await buildServer();
    const suffix = `deny-${Date.now()}`;
    const body = syntheticSlackWebhookBody(
      suffix,
      `<@UBOT> mark API design complete in ${projectName}`,
      SYNTHETIC_SLACK_USER_GUEST,
    );
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/slack-intake/connections/${connectionSlack}/mentions`,
      payload: body,
      headers: signedHeaders(body, Math.floor(Date.now() / 1000)),
    });
    expect(res.statusCode).toBe(202);
    const json = res.json() as { outcome: string; message: string };
    expect(json.outcome).toBe("rejected_permission");
    expect(json.message).toMatch(/permiso/i);
    const client = new pg.Client({ connectionString: adminUrl });
    await client.connect();
    const dedup = (
      await import("@alaira/connectors/slack")
    ).normalizeSlackMention(body.eventId, body.deliveryId, body.payload).dedupKey;
    const { rows } = await client.query<{ status: string }>(
      `SELECT status FROM slack_intake_pending_request
       WHERE tenant_id = $1 AND connection_id = $2 AND dedup_key = $3`,
      [owner.tenantId, connectionSlack, dedup],
    );
    await client.end();
    expect(rows[0]?.status).toBe("rejected");
    await app.close();
  });
});
