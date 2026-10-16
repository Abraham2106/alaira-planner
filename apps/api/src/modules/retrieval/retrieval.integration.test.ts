import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";
import {
  SYNTHETIC_RETRIEVAL_CHUNK_FAR,
  SYNTHETIC_RETRIEVAL_CHUNK_NEAR,
  SYNTHETIC_RETRIEVAL_QUERY,
} from "@alaira/domain/retrieval";
import { isPgVectorAvailable } from "./repository.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0123!";
const tenantSlug = `synth-retrieval-${Date.now()}`;
const otherTenantSlug = `synth-retrieval-b-${Date.now()}`;

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

async function pgVectorLoaded(): Promise<boolean> {
  const client = new pg.Client({ connectionString: adminUrl });
  try {
    await client.connect();
    return await isPgVectorAvailable(client);
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
      organizationName: "Synthetic Retrieval Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Retrieval",
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
const vectorUp = dbUp ? await pgVectorLoaded() : false;

describe.skipIf(!dbUp || !vectorUp)("TASK-0123 retrieval (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let otherTenantOwner: Awaited<ReturnType<typeof registerOwner>>;
  let projectId: string;
  let otherProjectId: string;

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
      payload: { name: "RAG corpus A", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;

    const createB = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { name: "RAG corpus B", deliveryProfile: hybridProfile },
    });
    expect(createB.statusCode).toBe(201);
    otherProjectId = (createB.json() as { id: string }).id;
  });

  it("TC-AI-03 partial: vector search returns citation with metadata", async () => {
    const app = await buildServer();
    const index = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/chunks`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        sourceKind: "manual",
        excerpt: "Acta de conformidad del cliente",
        embedding: SYNTHETIC_RETRIEVAL_CHUNK_NEAR,
        metadata: { title: "Acta" },
      },
    });
    expect(index.statusCode).toBe(201);
    const { chunk } = index.json() as { chunk: { id: string } };
    expect(chunk.id.startsWith("rtc_")).toBe(true);

    await app.inject({
      method: "POST",
      url: `/api/v1/projects/${otherProjectId}/retrieval/chunks`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        sourceKind: "manual",
        excerpt: "Secreto proyecto B",
        embedding: SYNTHETIC_RETRIEVAL_CHUNK_NEAR,
      },
    });

    const search = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/search`,
      headers: { cookie: owner.cookies },
      payload: { embedding: SYNTHETIC_RETRIEVAL_QUERY, limit: 5 },
    });
    expect(search.statusCode).toBe(200);
    const body = search.json() as {
      citations: Array<{ chunkId: string; excerpt: string; metadata: Record<string, unknown> }>;
    };
    expect(body.citations.length).toBeGreaterThanOrEqual(1);
    const top = body.citations[0];
    expect(top?.chunkId).toBe(chunk.id);
    expect(top?.metadata.title).toBe("Acta");
    expect(body.citations.every((c) => !c.excerpt.includes("Secreto proyecto B"))).toBe(true);
  });

  it("expired chunks are not returned", async () => {
    const app = await buildServer();
    await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/chunks`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        sourceKind: "manual",
        excerpt: "Caducado",
        embedding: SYNTHETIC_RETRIEVAL_CHUNK_FAR,
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
    });

    const search = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/search`,
      headers: { cookie: owner.cookies },
      payload: { embedding: SYNTHETIC_RETRIEVAL_CHUNK_FAR, limit: 10 },
    });
    expect(search.statusCode).toBe(200);
    const body = search.json() as { citations: Array<{ excerpt: string }> };
    expect(body.citations.every((c) => c.excerpt !== "Caducado")).toBe(true);
  });

  it("guest cannot index chunks (403)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/chunks`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: {
        sourceKind: "manual",
        excerpt: "Intento guest",
        embedding: SYNTHETIC_RETRIEVAL_QUERY,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it("restricted guest cannot search (policy gateway + authz)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/search`,
      headers: { cookie: guest.cookies },
      payload: { embedding: SYNTHETIC_RETRIEVAL_QUERY },
    });
    expect(res.statusCode).toBe(403);
  });

  it("cross-tenant cannot read citation", async () => {
    const app = await buildServer();
    const index = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/retrieval/chunks`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        sourceKind: "manual",
        excerpt: "Solo tenant A",
        embedding: SYNTHETIC_RETRIEVAL_QUERY,
      },
    });
    const { chunk } = index.json() as { chunk: { id: string } };

    const otherGet = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/retrieval/citations/${chunk.id}`,
      headers: { cookie: otherTenantOwner.cookies },
    });
    expect(otherGet.statusCode).toBe(404);
  });
});
