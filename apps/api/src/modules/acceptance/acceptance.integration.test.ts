import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0122!";
const tenantSlug = `synth-acc-${Date.now()}`;

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
  { key: "tests_green", text: "Pruebas en verde", required: true },
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
  const ownerEmail = `owner-acc-${Date.now()}@synth.test`;
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: "Synthetic Acceptance Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Acc",
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

describe.skipIf(!dbUp)("TASK-0122 acceptance (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let projectId: string;
  let deliverableId: string;
  let packageId: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug);

    const app = await buildServer();
    const guestEmail = `guest-acc-${Date.now()}@synth.test`;
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
      payload: { acceptToken, password: synthPassword, displayName: "Guest Acc" },
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
      payload: { name: "Aceptación sintética", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;

    const pkg = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/packages`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.1",
        title: "Paquete rollup",
        criteria: baseCriteria,
      },
    });
    expect(pkg.statusCode).toBe(201);
    packageId = (pkg.json() as { id: string }).id;

    const del = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/deliverables`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.1.1",
        title: "Entregable D",
        parentWorkNodeId: packageId,
        criteria: baseCriteria,
      },
    });
    expect(del.statusCode).toBe(201);
    deliverableId = (del.json() as { id: string }).id;
  });

  it("TC-ACC-02/03: request, accept with criteria, idempotent accept", async () => {
    const app = await buildServer();
    const req = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/deliverables/${deliverableId}/completion-requests`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey: "idem-req-0122-a" },
    });
    expect(req.statusCode).toBe(201);

    const statePending = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/deliverables/${deliverableId}/acceptance-state`,
      headers: { cookie: owner.cookies },
    });
    expect(statePending.json()).toMatchObject({
      lifecycle: { completionRequestStatus: "pending", acceptanceStatus: "not_accepted" },
      progressPercent: 0,
    });

    const accept = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/deliverables/${deliverableId}/acceptance`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        idempotencyKey: "idem-accept-0122-a",
        criterionEvaluations: [
          { key: "scope_defined", satisfied: true },
          { key: "tests_green", satisfied: true },
        ],
      },
    });
    expect(accept.statusCode).toBe(201);
    const first = accept.json() as { id: string; progressPercent: number };
    expect(first.progressPercent).toBe(100);

    const dup = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/deliverables/${deliverableId}/acceptance`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        idempotencyKey: "idem-accept-0122-a",
        criterionEvaluations: [
          { key: "scope_defined", satisfied: true },
          { key: "tests_green", satisfied: true },
        ],
      },
    });
    expect(dup.statusCode).toBe(201);
    expect((dup.json() as { id: string }).id).toBe(first.id);
  });

  it("TC-ACC-03: guest cannot accept", async () => {
    const app = await buildServer();
    const del2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/deliverables`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.1.2",
        title: "Entregable guest",
        parentWorkNodeId: packageId,
        criteria: baseCriteria,
      },
    });
    const d2 = (del2.json() as { id: string }).id;
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/deliverables/${d2}/acceptance`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: {
        idempotencyKey: "idem-guest-0122",
        criterionEvaluations: [{ key: "scope_defined", satisfied: true }],
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it("REQ-092 partial: cannot accept with missing required criterion", async () => {
    const app = await buildServer();
    const del3 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/wbs/deliverables`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        wbsCode: "1.1.3",
        title: "Incompleto",
        parentWorkNodeId: packageId,
        criteria: baseCriteria,
      },
    });
    const d3 = (del3.json() as { id: string }).id;
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/deliverables/${d3}/acceptance`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        idempotencyKey: "idem-incomplete-0122",
        criterionEvaluations: [{ key: "scope_defined", satisfied: true }],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("TC-ACC-05: revert acceptance restores progress to zero", async () => {
    const app = await buildServer();
    const rev = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/deliverables/${deliverableId}/revert-acceptance`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { idempotencyKey: "idem-revert-0122", reason: "Corrección baseline" },
    });
    expect(rev.statusCode).toBe(201);
    expect((rev.json() as { progressPercent: number }).progressPercent).toBe(0);

    const state = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/deliverables/${deliverableId}/acceptance-state`,
      headers: { cookie: owner.cookies },
    });
    expect(state.json()).toMatchObject({
      lifecycle: { acceptanceStatus: "not_accepted" },
      progressPercent: 0,
    });
  });
});
