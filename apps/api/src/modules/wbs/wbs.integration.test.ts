import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0111!";
const tenantSlug = `synth-wbs-${Date.now()}`;

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
  const ownerEmail = `owner-wbs-${Date.now()}@synth.test`;
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: "Synthetic WBS Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner WBS",
      password: synthPassword,
    },
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/iam/auth/login",
    payload: { tenantSlug: slug, email: ownerEmail, password: synthPassword },
  });
  expect(login.statusCode).toBe(200);
  const body = login.json() as { csrfToken: string; userId: string };
  return {
    cookies: cookieHeaderFromSetCookie(login.headers["set-cookie"]),
    csrf: body.csrfToken,
    userId: body.userId,
  };
}

const dbUp = await dbReachable();

describe.skipIf(!dbUp)("TASK-0111 WBS (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let projectId: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug);

    const app = await buildServer();
    const guestEmail = `guest-wbs-${Date.now()}@synth.test`;
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
      payload: { acceptToken, password: synthPassword, displayName: "Guest WBS" },
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
      payload: { name: "WBS Synth", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;
  });

  it("TC-WBS-01: duplicate code and cycle rejected", async () => {
    const app = await buildServer();
    const pkg1 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.1",
        title: "Paquete A",
        description: "Raíz WBS",
        criteria: baseCriteria,
        status: "active",
      },
    });
    expect(pkg1.statusCode).toBe(201);
    const pkgA = (pkg1.json() as { id: string }).id;

    const dup = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.1",
        title: "Duplicado",
        criteria: baseCriteria,
      },
    });
    expect(dup.statusCode).toBe(409);

    const pkg2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.2",
        title: "Paquete B",
        parentWorkNodeId: pkgA,
        criteria: baseCriteria,
      },
    });
    expect(pkg2.statusCode).toBe(201);
    const pkgB = (pkg2.json() as { id: string }).id;

    const cycle = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${projectId}/wbs/nodes/${pkgA}/parent`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { parentWorkNodeId: pkgB },
    });
    expect(cycle.statusCode).toBe(400);
    expect(cycle.json()).toMatchObject({ error: "Hierarchy would contain a cycle" });
  });

  it("TC-WBS-02: package with criteria and responsible", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "2.1",
        title: "Integración",
        description: "Paquete con criterios",
        responsibleUserId: owner.userId,
        estimateHours: 40,
        criteria: [
          { key: "design_ok", text: "Diseño aprobado", required: true },
          { key: "tests_green", text: "Pruebas en verde", required: false },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      nodeType: "work_package",
      wbsCode: "2.1",
      criteriaVersion: 1,
      estimateHours: 40,
    });
  });

  it("TC-WBS-03: deliverable criteria versioned and revision bump", async () => {
    const app = await buildServer();
    const pkg = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "3.1",
        title: "Paquete entregable",
        criteria: baseCriteria,
      },
    });
    const parentId = (pkg.json() as { id: string }).id;

    const del = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/deliverables`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "3.1.1",
        title: "Manual usuario",
        parentWorkNodeId: parentId,
        criteria: baseCriteria,
      },
    });
    expect(del.statusCode).toBe(201);
    const deliverableId = (del.json() as { id: string }).id;

    const criteriaV2 = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${projectId}/wbs/deliverables/${deliverableId}/criteria`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        criteria: [
          { key: "scope_defined", text: "Alcance v2", required: true },
          { key: "review_done", text: "Revisión editorial", required: true },
        ],
      },
    });
    expect(criteriaV2.statusCode).toBe(200);
    expect(criteriaV2.json()).toMatchObject({ criteriaVersion: 2 });

    const rev = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/deliverables/${deliverableId}/revisions`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {},
    });
    expect(rev.statusCode).toBe(201);
    expect(rev.json()).toMatchObject({ deliverableVersion: 2 });
  });

  it("guest cannot create root package (403 authz)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: {
        wbsCode: "9.9",
        title: "Denied",
        criteria: baseCriteria,
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: "forbidden" });
  });
});
