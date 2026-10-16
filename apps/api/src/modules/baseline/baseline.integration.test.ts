import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { parseProjectExternalId } from "@alaira/domain/project";
import { standardCalendar5x8, zonedLocalToUtc } from "@alaira/engine/schedule";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { appPool } from "../../db/pool.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0116!";
const tenantSlug = `synth-base-${Date.now()}`;

const hybridProfile = {
  planningMode: "hybrid" as const,
  scheduleEngine: true,
  agileExecution: true,
  financialControl: "full" as const,
  resourcePlanning: true,
  baselineRequired: true,
};

const baseCriteria = [{ key: "scope_defined", text: "Alcance", required: true }];
const defaultCalendar = standardCalendar5x8("America/Costa_Rica");

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

async function registerOwner(slug: string) {
  const app = await buildServer();
  const ownerEmail = `owner-base-${Date.now()}@synth.test`;
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: "Synthetic Baseline Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Baseline",
      password: synthPassword,
    },
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/iam/auth/login",
    payload: { tenantSlug: slug, email: ownerEmail, password: synthPassword },
  });
  expect(login.statusCode).toBe(200);
  const body = login.json() as { csrfToken: string };
  return {
    cookies: cookieHeaderFromSetCookie(login.headers["set-cookie"]),
    csrf: body.csrfToken,
  };
}

const dbUp = await dbReachable();

describe.skipIf(!dbUp)("TASK-0116 baseline (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let projectId: string;
  let taskA: string;
  const projectStartEpochMs = zonedLocalToUtc(2026, 1, 5, 8, 0, defaultCalendar.timeZone);

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug);

    const app = await buildServer();
    const guestEmail = `guest-base-${Date.now()}@synth.test`;
    const invite = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { email: guestEmail },
    });
    expect(invite.statusCode).toBe(201);
    const { acceptToken } = invite.json() as { acceptToken: string };
    await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations/accept",
      payload: { acceptToken, password: synthPassword, displayName: "Guest Baseline" },
    });
    const memberLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: guestEmail, password: synthPassword },
    });
    const memberBody = memberLogin.json() as { userId: string };
    await app.inject({
      method: "PATCH",
      url: `/api/v1/authz/memberships/${memberBody.userId}/org-role`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { orgRole: "guest" },
    });
    const guestLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: guestEmail, password: synthPassword },
    });
    const guestBody = guestLogin.json() as { csrfToken: string };
    guest = {
      cookies: cookieHeaderFromSetCookie(guestLogin.headers["set-cookie"]),
      csrf: guestBody.csrfToken,
    };

    const create = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { name: "Baseline Synth", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;

    const pkgA = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { wbsCode: "1.1", title: "Task A", criteria: baseCriteria },
    });
    expect(pkgA.statusCode).toBe(201);
    taskA = (pkgA.json() as { id: string }).id;

    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${projectId}/schedule/config`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { projectStartEpochMs, defaultCalendar },
    });
    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${projectId}/schedule/tasks/${taskA}`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { durationMinutes: 480 },
    });
  });

  it("TC-BASE-01: baseline frozen when forecast recalculates", async () => {
    const app = await buildServer();
    const recalc1 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/schedule/recalculate`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey: `recalc-base-1-${Date.now()}` },
    });
    expect(recalc1.statusCode).toBe(200);
    const forecastV1 = recalc1.json() as {
      forecastVersion: number;
      tasks: { workNodeId: string; earlyFinishEpochMs: number }[];
    };

    const approveKey = `approve-base-${Date.now()}`;
    const approve = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/baseline/approve`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        idempotencyKey: approveKey,
        reason: "M1 synthetic baseline",
        plannedCosts: [{ workNodeId: taskA, plannedCostMinor: 50_000 }],
      },
    });
    expect(approve.statusCode).toBe(201);
    const baseline = approve.json() as {
      baselineVersion: number;
      sourceForecastVersion: number;
      tasks: { earlyFinishEpochMs: number; plannedCostMinor: number | null }[];
    };
    expect(baseline.sourceForecastVersion).toBe(forecastV1.forecastVersion);
    const baselineFinish = baseline.tasks[0]!.earlyFinishEpochMs;

    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${projectId}/schedule/tasks/${taskA}`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { durationMinutes: 960 },
    });
    const recalc2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/schedule/recalculate`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey: `recalc-base-2-${Date.now()}` },
    });
    expect(recalc2.statusCode).toBe(200);
    const forecastV2 = recalc2.json() as {
      forecastVersion: number;
      tasks: { earlyFinishEpochMs: number }[];
    };
    expect(forecastV2.forecastVersion).toBeGreaterThan(forecastV1.forecastVersion);
    expect(forecastV2.tasks[0]!.earlyFinishEpochMs).not.toBe(baselineFinish);

    const getBaseline = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/baseline`,
      headers: { cookie: owner.cookies },
    });
    expect(getBaseline.statusCode).toBe(200);
    expect((getBaseline.json() as { tasks: { earlyFinishEpochMs: number }[] }).tasks[0]!
      .earlyFinishEpochMs).toBe(baselineFinish);

    const replay = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/baseline/approve`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey: approveKey },
    });
    expect(replay.statusCode).toBe(201);
    expect((replay.json() as { baselineVersion: number }).baselineVersion).toBe(
      baseline.baselineVersion,
    );
  });

  it("TC-BASE-04 partial: variance separates baseline, forecast and actual", async () => {
    const app = await buildServer();
    const baselineRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/baseline`,
      headers: { cookie: owner.cookies },
    });
    const baselineFinish = (
      baselineRes.json() as { tasks: { earlyFinishEpochMs: number }[] }
    ).tasks[0]!.earlyFinishEpochMs;

    const forecastRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/schedule/forecast`,
      headers: { cookie: owner.cookies },
    });
    const forecastFinish = (
      forecastRes.json() as { tasks: { earlyFinishEpochMs: number }[] }
    ).tasks[0]!.earlyFinishEpochMs;

    const actualFinish = baselineFinish + 120 * 60_000;
    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${projectId}/baseline/actuals/${taskA}`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        actualStartEpochMs: projectStartEpochMs,
        actualFinishEpochMs: actualFinish,
        actualCostMinor: 55_000,
      },
    });

    const varianceRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/baseline/variance`,
      headers: { cookie: owner.cookies },
    });
    expect(varianceRes.statusCode).toBe(200);
    const variance = varianceRes.json() as {
      tasks: {
        variance: {
          forecastFinishVsBaselineMinutes: number | null;
          actualFinishVsBaselineMinutes: number | null;
          actualCostVsBaselineMinor: number | null;
        };
      }[];
    };
    const row = variance.tasks.find((t) => t.variance.forecastFinishVsBaselineMinutes != null)!;
    expect(row.variance.forecastFinishVsBaselineMinutes).toBe(
      Math.round((forecastFinish - baselineFinish) / 60_000),
    );
    expect(row.variance.actualFinishVsBaselineMinutes).toBe(120);
    expect(row.variance.actualCostVsBaselineMinor).toBe(5_000);
  });

  it("baseline rows are immutable at database grants", async () => {
    const internalProjectId = parseProjectExternalId(projectId, "project")!;
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    let tenantId: string;
    try {
      const tenantRes = await admin.query<{ tenant_id: string }>(
        `SELECT tenant_id::text FROM project WHERE id = $1`,
        [internalProjectId],
      );
      tenantId = tenantRes.rows[0]!.tenant_id;
    } finally {
      await admin.end();
    }

    const client = await appPool.connect();
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      await expect(
        client.query(
          `UPDATE baseline_schedule_task SET early_finish_epoch_ms = 0
           WHERE tenant_id = $1 AND project_id = $2`,
          [tenantId, internalProjectId],
        ),
      ).rejects.toThrow(/permission denied/i);
    } finally {
      client.release();
    }
  });

  it("cross-tenant baseline read → 404; guest approve → 403", async () => {
    const app = await buildServer();
    const otherTenant = `synth-base-x-${Date.now()}`;
    const otherOwner = await registerOwner(otherTenant);
    const cross = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/baseline`,
      headers: { cookie: otherOwner.cookies },
    });
    expect(cross.statusCode).toBe(404);

    const forbidden = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/baseline/approve`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: { idempotencyKey: `guest-approve-${Date.now()}` },
    });
    expect(forbidden.statusCode).toBe(403);
  });
});
