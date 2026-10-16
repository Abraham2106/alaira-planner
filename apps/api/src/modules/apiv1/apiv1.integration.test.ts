import pg from "pg";
import { beforeAll, describe, expect, it } from "vitest";
import { OPENAPI_DOCUMENT_PATHS } from "@alaira/contracts/apiv1";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";
import { parseExternalId } from "@alaira/domain/iam";
import { parseProjectExternalId } from "@alaira/domain/project";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0112!";
const tenantSlug = `synth-apiv1-${Date.now()}`;
const otherTenantSlug = `synth-apiv1-b-${Date.now()}`;

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
      organizationName: "Synthetic Apiv1 Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Apiv1",
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
  await app.close();
  return {
    cookies: cookieHeaderFromSetCookie(login.headers["set-cookie"]),
    csrf: body.csrfToken,
    tenantId: body.tenantId,
    userId: body.userId,
    email: ownerEmail,
  };
}

const dbUp = await dbReachable();

describe.skipIf(!dbUp)("TASK-0112 apiv1 (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let otherOwner: Awaited<ReturnType<typeof registerOwner>>;
  let projectExternalId: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    owner = await registerOwner(tenantSlug, "owner");
    otherOwner = await registerOwner(otherTenantSlug, "other");

    const app = await buildServer();
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { name: "CSV Alpha", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectExternalId = (create.json() as { id: string }).id;

    const createB = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        name: "Kanban Beta",
        deliveryProfile: { ...hybridProfile, planningMode: "kanban" },
      },
    });
    expect(createB.statusCode).toBe(201);
    await app.close();

    const internalId = parseProjectExternalId(projectExternalId, "project");
    const tenantUuid = parseExternalId(owner.tenantId, "tenant");
    expect(internalId).toBeTruthy();
    expect(tenantUuid).toBeTruthy();
    const client = new pg.Client({ connectionString: adminUrl });
    await client.connect();
    try {
      await client.query(
        `INSERT INTO eventlog_project (tenant_id, project_id, name)
         VALUES ($1, $2, 'CSV Alpha')
         ON CONFLICT DO NOTHING`,
        [tenantUuid, internalId],
      );
    } finally {
      await client.end();
    }
  });

  it("TC-API-02 partial: OpenAPI lists project and event-log paths", async () => {
    const app = await buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/openapi.json" });
    expect(res.statusCode).toBe(200);
    const doc = res.json() as { paths: Record<string, unknown> };
    for (const path of OPENAPI_DOCUMENT_PATHS) {
      expect(doc.paths[path]).toBeDefined();
    }
    await app.close();
  });

  it("search projects: pagination and planningMode filter", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/search/projects?page=1&pageSize=1&planningMode=kanban",
      headers: { cookie: owner.cookies },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      items: { name: string }[];
      total: number;
      pageSize: number;
    };
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.name).toBe("Kanban Beta");
    await app.close();
  });

  it("cross-tenant: search event-log returns 404", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/search/projects/${projectExternalId}/event-log`,
      headers: { cookie: otherOwner.cookies },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("TC-PORT-01: CSV export/import roundtrip without silent truncation", async () => {
    const app = await buildServer();
    const before = await app.inject({
      method: "GET",
      url: "/api/v1/search/projects?page=1&pageSize=100",
      headers: { cookie: owner.cookies },
    });
    const beforeTotal = (before.json() as { total: number }).total;

    const exportRes = await app.inject({
      method: "GET",
      url: "/api/v1/port/sample/projects.csv",
      headers: { cookie: owner.cookies },
    });
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.headers["content-type"]).toMatch(/text\/csv/);
    const csv = exportRes.body as string;
    expect(csv).toContain("name,planning_mode");

    const importRes = await app.inject({
      method: "POST",
      url: "/api/v1/port/sample/projects.csv",
      headers: {
        cookie: owner.cookies,
        "x-alaira-csrf": owner.csrf,
        "content-type": "text/csv",
      },
      payload: csv,
    });
    expect(importRes.statusCode).toBe(200);
    const report = importRes.json() as { imported: number };
    expect(report.imported).toBeGreaterThan(0);

    const after = await app.inject({
      method: "GET",
      url: "/api/v1/search/projects?page=1&pageSize=100",
      headers: { cookie: owner.cookies },
    });
    const afterTotal = (after.json() as { total: number }).total;
    expect(afterTotal).toBe(beforeTotal + report.imported);
    await app.close();
  });

  it("CSRF required on CSV import write", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/port/sample/projects.csv",
      headers: { cookie: owner.cookies, "content-type": "text/csv" },
      payload: "name,planning_mode,schedule_engine,agile_execution,financial_control,resource_planning,baseline_required\n",
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });
});
