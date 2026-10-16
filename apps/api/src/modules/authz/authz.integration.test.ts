import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0106!";
const tenantSlug = `synth-authz-${Date.now()}`;

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

describe.skipIf(!dbUp)("TASK-0106 authz (80/20)", () => {
  let owner: { cookies: string; csrf: string; tenantId: string; userId: string };
  let guest: { cookies: string; csrf: string; userId: string };

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    const app = await buildServer();
    const ownerEmail = `owner-${Date.now()}@synth.test`;
    const memberEmail = `member-${Date.now()}@synth.test`;

    await app.inject({
      method: "POST",
      url: "/api/v1/iam/tenants/register",
      payload: {
        organizationName: "Synthetic Authz Org",
        slug: tenantSlug,
        ownerEmail,
        ownerDisplayName: "Owner Authz",
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
    owner = {
      cookies: cookieHeaderFromSetCookie(ownerLogin.headers["set-cookie"]),
      csrf: ownerBody.csrfToken,
      tenantId: ownerBody.tenantId,
      userId: ownerBody.userId,
    };

    const inviteRes = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations",
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { email: memberEmail },
    });
    expect(inviteRes.statusCode).toBe(201);
    const { acceptToken } = inviteRes.json() as { acceptToken: string };
    await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations/accept",
      payload: {
        acceptToken,
        password: synthPassword,
        displayName: "Guest Authz",
      },
    });
    const memberLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: { tenantSlug, email: memberEmail, password: synthPassword },
    });
    expect(memberLogin.statusCode).toBe(200);
    const memberBody = memberLogin.json() as { csrfToken: string; userId: string };
    guest = {
      cookies: cookieHeaderFromSetCookie(memberLogin.headers["set-cookie"]),
      csrf: memberBody.csrfToken,
      userId: memberBody.userId,
    };

    const demote = await app.inject({
      method: "PATCH",
      url: `/api/v1/authz/memberships/${guest.userId}/org-role`,
      headers: { cookie: owner.cookies, "x-alaira-csrf": owner.csrf },
      payload: { orgRole: "guest" },
    });
    expect(demote.statusCode).toBe(200);
  });

  it("TC-SEC-03: guest cannot enforce org:invite (403)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/authz/policy/enforce",
      headers: { cookie: guest.cookies },
      payload: {
        action: "org:invite",
        resource: { type: "organization", tenantId: owner.tenantId },
      },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: "forbidden" });
  });

  it("deny by default: guest cannot assign org roles (403)", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/authz/memberships/${owner.userId}/org-role`,
      headers: { cookie: guest.cookies, "x-alaira-csrf": guest.csrf },
      payload: { orgRole: "admin" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("owner can enforce org:read", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/authz/policy/enforce",
      headers: { cookie: owner.cookies },
      payload: {
        action: "org:read",
        resource: { type: "organization", tenantId: owner.tenantId },
      },
    });
    expect(res.statusCode).toBe(204);
  });

  it("GET /authz/me exposes org role for session", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/authz/me",
      headers: { cookie: guest.cookies },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ orgRole: "guest" });
  });
});
