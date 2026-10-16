import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";
import { setEvidenceBlobStore, LocalFilesystemBlobStore } from "./blob-store.js";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0118!";
const tenantSlug = `synth-evidence-${Date.now()}`;
const otherTenantSlug = `synth-evidence-b-${Date.now()}`;

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
      organizationName: "Synthetic Evidence Org",
      slug,
      ownerEmail,
      ownerDisplayName: "Owner Evidence",
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
    email: ownerEmail,
  };
}

const dbUp = await dbReachable();

describe.skipIf(!dbUp)("TASK-0118 evidence (80/20)", () => {
  let owner: Awaited<ReturnType<typeof registerOwner>>;
  let guest: { cookies: string; csrf: string };
  let otherTenantOwner: Awaited<ReturnType<typeof registerOwner>>;
  let projectId: string;
  let blobDir: string;

  beforeAll(async () => {
    blobDir = await mkdtemp(join(tmpdir(), "alaira-evidence-"));
    setEvidenceBlobStore(new LocalFilesystemBlobStore(blobDir));

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
      payload: { name: "Consultoría offline", deliveryProfile: hybridProfile },
    });
    expect(create.statusCode).toBe(201);
    projectId = (create.json() as { id: string }).id;
  });

  it("TC-EV-03 partial: attestation without git repository", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/evidence`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        kind: "attestation",
        title: "Acta de conformidad",
        description: "PDF firmado sin repositorio Git",
      },
    });
    expect(res.statusCode).toBe(201);
    const { record } = res.json() as { record: { id: string; kind: string } };
    expect(record.kind).toBe("attestation");
    expect(record.id.startsWith("evd_")).toBe(true);

    const get = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/evidence/${record.id}`,
      headers: { cookie: owner.cookies },
    });
    expect(get.statusCode).toBe(200);
  });

  it("TC-EV-04: EvidenceEvent REQ-087 fields and dedupe idempotency", async () => {
    const app = await buildServer();
    const payload = {
      source: "synthetic-github",
      externalId: "pr-1001",
      dedupeKey: "synthetic-github:delivery-unique-0118",
      actor: { externalId: "bot", resolvedUserId: null },
      timestamp: "2026-10-16T08:00:00.000Z",
      eventType: "artifact.lifecycle.changed",
      artifact: {
        externalId: "repo/pr/1001",
        kind: "pull_request",
        url: "https://example.com/pr/1001",
      },
      projectCandidate: null,
      workItemCandidate: null,
      confidence: 0.15,
      rawReference: { deliveryId: "d1" },
      normalizedPayload: { action: "merged" },
      aiInterpretation: null,
      acceptedBy: null,
      effect: "context_only",
    };

    const first = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/evidence-events`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload,
    });
    expect(first.statusCode).toBe(201);
    const firstBody = first.json() as {
      event: { id: string; linkState: string; dedupeKey: string; effect: string };
    };
    expect(firstBody.event.id.startsWith("eev_")).toBe(true);
    expect(firstBody.event.linkState).toBe("unlinked");
    expect(firstBody.event.dedupeKey).toBe(payload.dedupeKey);

    const second = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/evidence-events`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload,
    });
    expect(second.statusCode).toBe(200);
    const secondBody = second.json() as { event: { id: string } };
    expect(secondBody.event.id).toBe(firstBody.event.id);
  });

  it("guest cannot attach evidence", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/evidence`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: {
        kind: "link",
        title: "Enlace",
        url: "https://example.com/doc",
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it("cross-tenant cannot read evidence record or blob", async () => {
    const app = await buildServer();
    const create = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/evidence`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: {
        kind: "document",
        title: "Informe",
        contentBase64: Buffer.from("synthetic-pdf-bytes").toString("base64"),
        contentType: "application/pdf",
      },
    });
    expect(create.statusCode).toBe(201);
    const { record } = create.json() as { record: { id: string } };

    const otherGet = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/evidence/${record.id}`,
      headers: { cookie: otherTenantOwner.cookies },
    });
    expect(otherGet.statusCode).toBe(404);

    const otherBlob = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/evidence/${record.id}/blob`,
      headers: { cookie: otherTenantOwner.cookies },
    });
    expect(otherBlob.statusCode).toBe(404);
  });
});
