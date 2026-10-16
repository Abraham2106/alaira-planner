import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { loadDbConfig } from "../../db/config.js";
import { migrate } from "../../db/migrate.js";
import { appPool } from "../../db/pool.js";
import { buildServer } from "../../server.js";

const { adminUrl } = loadDbConfig();
const synthPassword = "SyntheticPass-0101!";
const slugA = "synth-org-alpha-0101";
const slugB = "synth-org-beta-0101";

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

async function registerAndLogin(
  app: Awaited<ReturnType<typeof buildServer>>,
  slug: string,
  email: string,
  orgName: string,
  displayName: string,
): Promise<{ cookies: string; csrf: string }> {
  await app.inject({
    method: "POST",
    url: "/api/v1/iam/tenants/register",
    payload: {
      organizationName: orgName,
      slug,
      ownerEmail: email,
      ownerDisplayName: displayName,
      password: synthPassword,
    },
  });
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/iam/auth/login",
    payload: { tenantSlug: slug, email, password: synthPassword },
  });
  const body = login.json() as { csrfToken: string };
  return {
    cookies: login.headers["set-cookie"] as string,
    csrf: body.csrfToken,
  };
}

const dbUp = await dbReachable();

describe.skipIf(!dbUp)("TASK-0101 IAM (80/20)", () => {
  let alphaOwner: { cookies: string; csrf: string };
  let betaOwner: { cookies: string; csrf: string };
  let betaMemberUserId: string;

  beforeAll(async () => {
    await migrate(adminUrl, "up");
    const app = await buildServer();
    alphaOwner = await registerAndLogin(
      app,
      slugA,
      "owner-alpha@synth.test",
      "Synthetic Org Alpha",
      "Owner Alpha",
    );
    betaOwner = await registerAndLogin(
      app,
      slugB,
      "owner-beta@synth.test",
      "Synthetic Org Beta",
      "Owner Beta",
    );
    const invite = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations",
      headers: { cookie: betaOwner.cookies, "x-alaira-csrf": betaOwner.csrf },
      payload: { email: "member-beta@synth.test" },
    });
    const { acceptToken } = invite.json() as { acceptToken: string };
    await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations/accept",
      payload: {
        acceptToken,
        password: synthPassword,
        displayName: "Member Beta",
      },
    });
    const memberLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: {
        tenantSlug: slugB,
        email: "member-beta@synth.test",
        password: synthPassword,
      },
    });
    betaMemberUserId = (memberLogin.json() as { userId: string }).userId;
    await app.close();
  });

  afterAll(async () => {
    await appPool.end();
  });

  it("CSRF: write without x-alaira-csrf is rejected", async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations",
      headers: { cookie: alphaOwner.cookies },
      payload: { email: "csrf-check@synth.test" },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it("TC-SEC-02: expired session is rejected", async () => {
    const app = await buildServer();
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: {
        tenantSlug: slugA,
        email: "owner-alpha@synth.test",
        password: synthPassword,
      },
    });
    const cookies = login.headers["set-cookie"] as string;
    const sessionId = cookies.match(/alaira_session=([^;]+)/)?.[1];
    await appPool.query(
      `UPDATE session SET expires_at = now() - interval '1 minute' WHERE id = $1`,
      [sessionId],
    );
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/iam/me",
      headers: { cookie: cookies },
    });
    expect(me.statusCode).toBe(403);
    await app.close();
  });

  it("TC-IAM-01: invite, accept, deactivate — deactivated cannot access", async () => {
    const app = await buildServer();
    const invite = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations",
      headers: { cookie: betaOwner.cookies, "x-alaira-csrf": betaOwner.csrf },
      payload: { email: "iam-flow@synth.test" },
    });
    expect(invite.statusCode).toBe(201);
    const { acceptToken } = invite.json() as { acceptToken: string };
    const accept = await app.inject({
      method: "POST",
      url: "/api/v1/iam/invitations/accept",
      payload: {
        acceptToken,
        password: synthPassword,
        displayName: "Flow Member",
      },
    });
    expect(accept.statusCode).toBe(200);
    const memberId = (accept.json() as { userId: string }).userId;

    const memberLogin = await app.inject({
      method: "POST",
      url: "/api/v1/iam/auth/login",
      payload: {
        tenantSlug: slugB,
        email: "iam-flow@synth.test",
        password: synthPassword,
      },
    });
    const memberCookies = memberLogin.headers["set-cookie"] as string;

    expect(
      (
        await app.inject({
          method: "PATCH",
          url: `/api/v1/iam/memberships/${memberId}/deactivate`,
          headers: { cookie: betaOwner.cookies, "x-alaira-csrf": betaOwner.csrf },
        })
      ).statusCode,
    ).toBe(200);

    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/iam/me",
          headers: { cookie: memberCookies },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/iam/auth/login",
          payload: {
            tenantSlug: slugB,
            email: "iam-flow@synth.test",
            password: synthPassword,
          },
        })
      ).statusCode,
    ).toBe(403);
    await app.close();
  });

  it("TC-SEC-01: other-tenant user id returns 404", async () => {
    const app = await buildServer();
    const cross = await app.inject({
      method: "PATCH",
      url: `/api/v1/iam/memberships/${betaMemberUserId}/deactivate`,
      headers: { cookie: alphaOwner.cookies, "x-alaira-csrf": alphaOwner.csrf },
    });
    expect(cross.statusCode).toBe(404);
    await app.close();
  });
});
