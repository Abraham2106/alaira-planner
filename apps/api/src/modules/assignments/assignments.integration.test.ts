import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0114!";
const tenantSlug = `synth-asn-${Date.now()}`;

const hybridProfile = {
  planningMode: "hybrid" as const,
  scheduleEngine: true,
  agileExecution: true,
  financialControl: "full" as const,
  resourcePlanning: true,
  baselineRequired: true,
};

const baseCriteria = [
  { key: "scope_defined", text: "Alcance documentado", required: true },
];

const continuousCalendar = {
  timeZone: "UTC",
  workingWeekdays: [1, 2, 3, 4, 5, 6, 7],
  workDayStart: { hour: 0, minute: 0 },
  workMinutesPerDay: 1440,
  exceptions: [] as const,
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

async function registerOwner(slug: string) {
  const app = await buildServer();
  const ownerEmail = `owner-asn-${Date.now()}@synth.test`;
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: "Synthetic Assignments Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Assignments",
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

describe.skipIf(!dbUp)("TASK-0114 assignments (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let projectId: string;
  let personId: string;
  let taskA: string;
  let taskB: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug);

    const app = await buildServer();
    const guestEmail = `guest-asn-${Date.now()}@synth.test`;
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
      payload: { acceptToken, password: synthPassword, displayName: "Guest Assignments" },
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
      payload: { name: "Assignments Synth", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;

    const pkgA = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { wbsCode: "1.1", title: "Tarea A", criteria: baseCriteria },
    });
    expect(pkgA.statusCode).toBe(201);
    taskA = (pkgA.json() as { id: string }).id;

    const pkgB = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { wbsCode: "1.2", title: "Tarea B", criteria: baseCriteria },
    });
    expect(pkgB.statusCode).toBe(201);
    taskB = (pkgB.json() as { id: string }).id;

    const person = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/assignments/people`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        displayName: "Ana Synth",
        teamName: "Equipo Alpha",
        calendar: continuousCalendar,
      },
    });
    expect(person.statusCode).toBe(201);
    personId = (person.json() as { id: string }).id;
  });

  it("TC-RES-02: persisted overlapping assignments trigger overassignment", async () => {
    const app = await buildServer();
    const hour = 3_600_000;

    const a1 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/assignments`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        personId,
        workNodeId: taskA,
        units: 1,
        workMinutes: 240,
        durationMinutes: 240,
        scheduledStartEpochMs: 0,
        scheduledFinishEpochMs: 4 * hour,
      },
    });
    expect(a1.statusCode).toBe(201);

    const a2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/assignments`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        personId,
        workNodeId: taskB,
        units: 1,
        workMinutes: 240,
        durationMinutes: 240,
        scheduledStartEpochMs: 2 * hour,
        scheduledFinishEpochMs: 6 * hour,
      },
    });
    expect(a2.statusCode).toBe(201);

    const analysis = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/assignments/capacity`,
      headers: { cookie: owner.cookies },
    });
    expect(analysis.statusCode).toBe(200);
    const body = analysis.json() as {
      conflicts: Array<{
        personId: string;
        intervalStartEpochMs: number;
        intervalEndEpochMs: number;
        assignedUnits: number;
        maxUnits: number;
      }>;
    };
    expect(body.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(body.conflicts[0]).toMatchObject({
      intervalStartEpochMs: 2 * hour,
      intervalEndEpochMs: 4 * hour,
      assignedUnits: 2,
      maxUnits: 1,
    });
  });

  it("TC-RES-04 partial: PATCH units recalculates duration (fixed_work)", async () => {
    const app = await buildServer();
    const list = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/assignments`,
      headers: { cookie: owner.cookies },
    });
    expect(list.statusCode).toBe(200);
    const assignmentId = (list.json() as { assignments: Array<{ id: string; workNodeId: string }> })
      .assignments.find((a) => a.workNodeId === taskA)!.id;

    const patched = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${projectId}/assignments/${assignmentId}`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        units: 0.5,
        recalcMode: "fixed_work",
        changedField: "units",
      },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json()).toMatchObject({
      workMinutes: 240,
      units: 0.5,
      durationMinutes: 480,
    });
  });

  it("guest cannot create synthetic person (403 authz)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/assignments/people`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: {
        displayName: "Denied",
        calendar: continuousCalendar,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: "forbidden" });
  });

  it("tenant isolation: foreign project returns not_found", async () => {
    const app = await buildServer();
    const otherSlug = `synth-asn-other-${Date.now()}`;
    const otherOwner = await registerOwner(otherSlug);
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/assignments/people`,
      headers: { cookie: otherOwner.cookies },
    });
    expect(res.statusCode).toBe(404);
  });
});
