import Fastify from "fastify";
import cookie from "@fastify/cookie";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ActorContext, TenantId } from "@alaira/domain";
import { DomainError } from "@alaira/domain";
import { loadDbConfig } from "../db/config.js";
import { migrate } from "../db/migrate.js";
import { appPool } from "../db/pool.js";
import { discoverApiModules } from "./load-modules.js";
import { seedPocSyntheticTenants } from "./poc-test-seed.js";
import { register as registerPoc } from "../modules/poc/index.js";
import {
  acceptPocItemCommand,
  countOutboxEventsForAcceptance,
  getPocItemForActor,
} from "../modules/poc/service.js";

const { adminUrl } = loadDbConfig();

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

function actorFromSession(
  seed: Awaited<ReturnType<typeof seedPocSyntheticTenants>>,
  which: "A" | "B",
): ActorContext {
  return {
    tenantId: (which === "A" ? seed.tenantA : seed.tenantB) as TenantId,
    userId: which === "A" ? "usr-a" : "usr-b",
    roles: ["member"],
  };
}

async function buildPocApp(
  seed: Awaited<ReturnType<typeof seedPocSyntheticTenants>>,
) {
  const app = Fastify();
  await app.register(cookie);
  app.decorate("resolveActorContext", async (request): Promise<ActorContext> => {
    const sessionId =
      (request.cookies?.alaira_session as string | undefined) ??
      (request.headers["x-alaira-session"] as string | undefined);
    if (sessionId === seed.sessionA) return actorFromSession(seed, "A");
    if (sessionId === seed.sessionB) return actorFromSession(seed, "B");
    throw new DomainError("FORBIDDEN", "Missing session");
  });
  await registerPoc(app);
  return app;
}

describe.skipIf(!dbUp)("TASK-0002 acceptance (POC)", () => {
  let seed: Awaited<ReturnType<typeof seedPocSyntheticTenants>>;

  beforeAll(async () => {
    await migrate(adminUrl, "down");
    await migrate(adminUrl, "up");
    seed = await seedPocSyntheticTenants(adminUrl);
  });

  afterAll(async () => {
    await appPool.end();
  });

  it("criterion 7: API module autodiscovery registers poc", async () => {
    const mods = await discoverApiModules();
    expect(mods.some((m) => m.name === "poc")).toBe(true);
  });

  it("criterion 2 / TC-OPS-02: migration up then down restores schema", async () => {
    await migrate(adminUrl, "down");
    const client = new pg.Client({ connectionString: adminUrl });
    await client.connect();
    const reg = await client.query(`SELECT to_regclass('public.poc_item') AS rel`);
    expect(reg.rows[0]?.rel).toBeNull();
    await client.end();
    await migrate(adminUrl, "up");
    seed = await seedPocSyntheticTenants(adminUrl);
  });

  it("criterion 3 / TC-SEC-01: RLS blocks cross-tenant; 404 indistinguishable", async () => {
    const actorA = actorFromSession(seed, "A");
    await expect(
      getPocItemForActor(actorA, seed.itemB, { applyAppTenantFilter: false }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const app = await buildPocApp(seed);
    const missing = await app.inject({
      method: "GET",
      url: `/api/v1/poc/items/018f0000-0000-7000-8000-000000000099`,
      headers: { "x-alaira-session": seed.sessionA },
    });
    const cross = await app.inject({
      method: "GET",
      url: `/api/v1/poc/items/${seed.itemB}`,
      headers: { "x-alaira-session": seed.sessionA },
    });
    expect(missing.statusCode).toBe(404);
    expect(cross.statusCode).toBe(404);
    expect(cross.body).toBe(missing.body);
    await app.close();
  });

  it("criterion 4 / TC-INT-01: same idempotency key → one outbox event", async () => {
    const actorA = actorFromSession(seed, "A");
    const key = "idem-key-0002-poc-accept";
    await acceptPocItemCommand(actorA, seed.itemA, key);
    await acceptPocItemCommand(actorA, seed.itemA, key);
    expect(await countOutboxEventsForAcceptance(seed.tenantA, seed.itemA)).toBe(1);
  });
});
