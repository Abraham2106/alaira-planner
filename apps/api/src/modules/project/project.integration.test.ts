import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0110!";
const tenantSlug = `synth-project-${Date.now()}`;
const otherTenantSlug = `synth-project-b-${Date.now()}`;

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

async function registerOwner(slug: string, emailPrefix: string) {
  const app = await buildServer();
  const ownerEmail = `${emailPrefix}-${Date.now()}@synth.test`;
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: "Synthetic Project Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Project",
      password: synthPassword,
    },
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/iam/auth/login",
    payload: { tenantSlug: slug, email: ownerEmail, password: synthPassword },
  });
  expect(login.statusCode).toBe(200);
  const body = login.json() as { csrfToken: string; tenantId: string; userId: string };
  return {
    cookies: cookieHeaderFromSetCookie(login.headers["set-cookie"]),
    csrf: body.csrfToken,
    tenantId: body.tenantId,
    userId: body.userId,
    email: ownerEmail,
  };
}

const dbUp = await dbReachable();

describe.skipIf(!dbUp)("TASK-0110 project graph (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let otherTenantOwner: Awaited<ReturnType<typeof registerOwner>>;
  let projectId: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug, "owner");
    otherTenantOwner = await registerOwner(otherTenantSlug, "other");

    const app = await buildServer();
    const guestEmail = `guest-${Date.now()}@synth.test`;
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
      payload: { acceptToken, password: synthPassword, displayName: "Guest" },
    });
    const memberLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: guestEmail, password: synthPassword },
    });
    expect(memberLogin.statusCode).toBe(200);
    const memberBody = memberLogin.json() as { userId: string };
    const demote = await app.inject({
      method: "PATCH",
      url: `/api/v1/authz/memberships/${memberBody.userId}/org-role`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { orgRole: "guest" },
    });
    expect(demote.statusCode).toBe(200);
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
      payload: { name: "Plataforma 2.0", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;
  });

  it("TC-HYB-02: predictive and Scrum branches share project_id", async () => {
    const app = await buildServer();
    const arch = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/branches`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { title: "Arquitectura", executionModeOverride: "predictive" },
    });
    expect(arch.statusCode).toBe(201);
    expect(arch.json()).toMatchObject({
      projectId,
      effectiveExecutionMode: "predictive",
    });

    const backend = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/branches`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { title: "Backend", executionModeOverride: "scrum" },
    });
    expect(backend.statusCode).toBe(201);
    expect(backend.json()).toMatchObject({
      projectId,
      effectiveExecutionMode: "scrum",
    });

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/branches`,
      headers: { cookie: owner.cookies },
    });
    expect(list.statusCode).toBe(200);
    const branches = (list.json() as { branches: { title: string; effectiveExecutionMode: string }[] })
      .branches;
    const archRow = branches.find((b) => b.title === "Arquitectura");
    const backendRow = branches.find((b) => b.title === "Backend");
    expect(archRow?.effectiveExecutionMode).toBe("predictive");
    expect(backendRow?.effectiveExecutionMode).toBe("scrum");
  });

  it("invalid custom field type → 400 validation_error", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/custom-fields`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { fieldKey: "risk_score", fieldType: "currency", label: "Risk" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "validation_error" });
  });

  it("guest cannot create branch (403 authz)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/branches`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: { title: "Denied", executionModeOverride: "kanban" },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: "forbidden" });
  });

  it("cross-tenant read returns 404", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}`,
      headers: { cookie: otherTenantOwner.cookies },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "not_found" });
  });
});
