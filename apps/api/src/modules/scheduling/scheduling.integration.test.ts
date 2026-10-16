import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import {
  computeCpmSchedule,
  standardCalendar5x8,
  workMinutesBetween,
  zonedLocalToUtc,
} from "@alaira/engine/schedule";
import { parseProjectExternalId } from "@alaira/domain/project";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0113!";
const tenantSlug = `synth-sch-${Date.now()}`;

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
  const ownerEmail = `owner-sch-${Date.now()}@synth.test`;
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: "Synthetic Schedule Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Schedule",
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

describe.skipIf(!dbUp)("TASK-0113 scheduling (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let projectId: string;
  let taskA: string;
  let taskB: string;
  const projectStartEpochMs = zonedLocalToUtc(2026, 1, 5, 8, 0, defaultCalendar.timeZone);

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug);

    const app = await buildServer();
    const guestEmail = `guest-sch-${Date.now()}@synth.test`;
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
      payload: { acceptToken, password: synthPassword, displayName: "Guest Schedule" },
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
      payload: { name: "Schedule Synth", deliveryProfile: hybridProfile },
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

    const pkgB = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { wbsCode: "1.2", title: "Task B", criteria: baseCriteria },
    });
    expect(pkgB.statusCode).toBe(201);
    taskB = (pkgB.json() as { id: string }).id;

    const config = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${projectId}/schedule/config`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { projectStartEpochMs, defaultCalendar },
    });
    expect(config.statusCode).toBe(200);

    for (const [nodeId, durationMinutes] of [
      [taskA, 480],
      [taskB, 480],
    ] as const) {
      const put = await app.inject({
        method: "PUT",
        url: `/api/v1/projects/${projectId}/schedule/tasks/${nodeId}`,
        headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
        payload: { durationMinutes },
      });
      expect(put.statusCode).toBe(200);
    }
  });

  it("TC-SCH-03/04: FS with lag persists and matches engine oracle", async () => {
    const app = await buildServer();
    const dep = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/schedule/dependencies`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        predecessorWorkNodeId: taskA,
        successorWorkNodeId: taskB,
        type: "FS",
        lagMinutes: 240,
      },
    });
    expect(dep.statusCode).toBe(201);

    const idempotencyKey = `recalc-sch-${Date.now()}`;
    const recalc = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/schedule/recalculate`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey },
    });
    expect(recalc.statusCode).toBe(200);
    const forecast = recalc.json() as {
      forecastVersion: number;
      tasks: { workNodeId: string; earlyStartEpochMs: number; earlyFinishEpochMs: number }[];
    };

    const internalA = parseProjectExternalId(taskA, "workNode")!;
    const internalB = parseProjectExternalId(taskB, "workNode")!;
    const oracle = computeCpmSchedule({
      projectStartEpochMs,
      defaultCalendar,
      tasks: [
        { id: internalA, durationMinutes: 480 },
        { id: internalB, durationMinutes: 480 },
      ],
      dependencies: [
        {
          id: "oracle-dep",
          predecessorId: internalA,
          successorId: internalB,
          type: "FS",
          lagMinutes: 240,
        },
      ],
    });
    const apiA = forecast.tasks.find((t) => t.workNodeId === taskA)!;
    const apiB = forecast.tasks.find((t) => t.workNodeId === taskB)!;
    const oraA = oracle.tasks.find((t) => t.taskId === internalA)!;
    const oraB = oracle.tasks.find((t) => t.taskId === internalB)!;

    expect(apiA.earlyStartEpochMs).toBe(oraA.earlyStartEpochMs);
    expect(apiA.earlyFinishEpochMs).toBe(oraA.earlyFinishEpochMs);
    expect(apiB.earlyStartEpochMs).toBe(oraB.earlyStartEpochMs);
    expect(workMinutesBetween(apiA.earlyFinishEpochMs, apiB.earlyStartEpochMs, defaultCalendar)).toBe(
      240,
    );

    const replay = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/schedule/recalculate`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey },
    });
    expect(replay.statusCode).toBe(200);
    expect((replay.json() as { forecastVersion: number }).forecastVersion).toBe(
      forecast.forecastVersion,
    );
  });

  it("TC-SCH-05: dependency cycle rejected before persist", async () => {
    const app = await buildServer();
    const otherTenant = `synth-sch-other-${Date.now()}`;
    const otherOwner = await registerOwner(otherTenant);
    const isolated = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: { name: "Cycle", deliveryProfile: hybridProfile },
    });
    const isoProject = (isolated.json() as { id: string }).id;
    const p1 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${isoProject}/wbs/packages`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: { wbsCode: "9.1", title: "C1", criteria: baseCriteria },
    });
    const p2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${isoProject}/wbs/packages`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: { wbsCode: "9.2", title: "C2", criteria: baseCriteria },
    });
    const n1 = (p1.json() as { id: string }).id;
    const n2 = (p2.json() as { id: string }).id;
    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${isoProject}/schedule/config`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: { projectStartEpochMs: 0, defaultCalendar },
    });
    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${isoProject}/schedule/tasks/${n1}`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: { durationMinutes: 60 },
    });
    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${isoProject}/schedule/tasks/${n2}`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: { durationMinutes: 60 },
    });
    const first = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${isoProject}/schedule/dependencies`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: {
        predecessorWorkNodeId: n1,
        successorWorkNodeId: n2,
        type: "FS",
      },
    });
    expect(first.statusCode).toBe(201);
    const cycle = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${isoProject}/schedule/dependencies`,
      headers: { cookie: otherOwner.cookies, "x-alaira-csrf": otherOwner.csrf },
      payload: {
        predecessorWorkNodeId: n2,
        successorWorkNodeId: n1,
        type: "FS",
      },
    });
    expect(cycle.statusCode).toBe(400);
    expect(cycle.json()).toMatchObject({ error: "cycle" });
  });

  it("cross-tenant project schedule config → 404", async () => {
    const app = await buildServer();
    const otherTenant = `synth-sch-x-${Date.now()}`;
    const otherOwner = await registerOwner(otherTenant);
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/schedule/config`,
      headers: { cookie: otherOwner.cookies },
    });
    expect(res.statusCode).toBe(404);
  });

  it("guest cannot recalculate schedule → 403", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/schedule/recalculate`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: { idempotencyKey: `guest-recalc-${Date.now()}` },
    });
    expect(res.statusCode).toBe(403);
  });
});
